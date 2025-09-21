const express = require("express");
const { body, validationResult, query } = require("express-validator");
const xss = require("xss");
const { db } = require("../database/init");
const { authenticateAdmin } = require("../middleware/auth");

const router = express.Router();

// Валидация для создания/обновления задачи
const taskValidation = [
	body("username")
		.trim()
		.isLength({ min: 1, max: 100 })
		.withMessage(
			"Имя пользователя обязательно и не должно превышать 100 символов"
		)
		.escape(),
	body("email")
		.isEmail()
		.withMessage("Введите корректный email")
		.normalizeEmail(),
	body("text")
		.trim()
		.isLength({ min: 1, max: 1000 })
		.withMessage("Текст задачи обязателен и не должен превышать 1000 символов")
		.escape(),
];

// Валидация для обновления задачи администратором
const adminTaskValidation = [
	body("text")
		.optional()
		.trim()
		.isLength({ min: 1, max: 1000 })
		.withMessage("Текст задачи не должен превышать 1000 символов")
		.escape(),
	body("status")
		.optional()
		.isIn(["pending", "completed"])
		.withMessage("Статус должен быть pending или completed"),
];

// Получение списка задач с пагинацией и сортировкой
router.get(
	"/",
	[
		query("page")
			.optional()
			.isInt({ min: 1 })
			.withMessage("Страница должна быть положительным числом"),
		query("limit")
			.optional()
			.isInt({ min: 1, max: 10 })
			.withMessage("Лимит должен быть от 1 до 10"),
		query("sortBy")
			.optional()
			.isIn(["username", "email", "status", "created_at"])
			.withMessage("Недопустимое поле для сортировки"),
		query("sortOrder")
			.optional()
			.isIn(["asc", "desc"])
			.withMessage("Порядок сортировки должен быть asc или desc"),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					message: "Ошибки валидации",
					errors: errors.array(),
				});
			}

			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 3;
			const sortBy = req.query.sortBy || "created_at";
			const sortOrder = req.query.sortOrder || "desc";
			const offset = (page - 1) * limit;

			// Получение общего количества задач
			const countQuery = "SELECT COUNT(*) as total FROM tasks";
			const totalTasks = await new Promise((resolve, reject) => {
				db.get(countQuery, (err, row) => {
					if (err) reject(err);
					else resolve(row.total);
				});
			});

			const totalPages = Math.ceil(totalTasks / limit);

			// Получение задач с сортировкой и пагинацией
			const tasksQuery = `
      SELECT id, username, email, text, status, is_edited_by_admin, created_at, updated_at
      FROM tasks 
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

			const tasks = await new Promise((resolve, reject) => {
				db.all(tasksQuery, [limit, offset], (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			});

			res.json({
				success: true,
				data: {
					tasks,
					pagination: {
						currentPage: page,
						totalPages,
						totalTasks,
						limit,
					},
				},
			});
		} catch (error) {
			console.error("Ошибка получения задач:", error);
			res.status(500).json({
				success: false,
				message: "Ошибка получения списка задач",
			});
		}
	}
);

// Создание новой задачи
router.post("/", taskValidation, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Ошибки валидации",
				errors: errors.array(),
			});
		}

		const { username, email, text } = req.body;

		// Защита от XSS
		const sanitizedUsername = xss(username);
		const sanitizedEmail = xss(email);
		const sanitizedText = xss(text);

		const insertQuery = `
      INSERT INTO tasks (username, email, text, status)
      VALUES (?, ?, ?, 'pending')
    `;

		const result = await new Promise((resolve, reject) => {
			db.run(
				insertQuery,
				[sanitizedUsername, sanitizedEmail, sanitizedText],
				function (err) {
					if (err) reject(err);
					else resolve({ id: this.lastID });
				}
			);
		});

		res.status(201).json({
			success: true,
			message: "Задача успешно создана",
			data: { id: result.id },
		});
	} catch (error) {
		console.error("Ошибка создания задачи:", error);
		res.status(500).json({
			success: false,
			message: "Ошибка создания задачи",
		});
	}
});

// Обновление задачи администратором
router.put("/:id", authenticateAdmin, adminTaskValidation, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Ошибки валидации",
				errors: errors.array(),
			});
		}

		const taskId = req.params.id;
		const { text, status } = req.body;

		// Проверка существования задачи
		const existingTask = await new Promise((resolve, reject) => {
			db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		if (!existingTask) {
			return res.status(404).json({
				success: false,
				message: "Задача не найдена",
			});
		}

		// Подготовка данных для обновления
		const updateFields = [];
		const updateValues = [];
		let isEditedByAdmin = existingTask.is_edited_by_admin;

		if (text !== undefined) {
			const sanitizedText = xss(text);
			if (sanitizedText !== existingTask.text) {
				updateFields.push("text = ?");
				updateValues.push(sanitizedText);
				isEditedByAdmin = 1;
			}
		}

		if (status !== undefined && status !== existingTask.status) {
			updateFields.push("status = ?");
			updateValues.push(status);
		}

		if (isEditedByAdmin !== existingTask.is_edited_by_admin) {
			updateFields.push("is_edited_by_admin = ?");
			updateValues.push(isEditedByAdmin);
		}

		// Всегда обновляем время изменения
		updateFields.push("updated_at = CURRENT_TIMESTAMP");
		updateValues.push(taskId);

		const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

		await new Promise((resolve, reject) => {
			db.run(updateQuery, updateValues, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		res.json({
			success: true,
			message: "Задача успешно обновлена",
		});
	} catch (error) {
		console.error("Ошибка обновления задачи:", error);
		res.status(500).json({
			success: false,
			message: "Ошибка обновления задачи",
		});
	}
});

// Получение задачи по ID
router.get("/:id", async (req, res) => {
	try {
		const taskId = req.params.id;

		const task = await new Promise((resolve, reject) => {
			db.get(
				"SELECT id, username, email, text, status, is_edited_by_admin, created_at, updated_at FROM tasks WHERE id = ?",
				[taskId],
				(err, row) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		if (!task) {
			return res.status(404).json({
				success: false,
				message: "Задача не найдена",
			});
		}

		res.json({
			success: true,
			data: task,
		});
	} catch (error) {
		console.error("Ошибка получения задачи:", error);
		res.status(500).json({
			success: false,
			message: "Ошибка получения задачи",
		});
	}
});

module.exports = router;
