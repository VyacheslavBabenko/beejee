const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../database/init");

const router = express.Router();

const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Валидация для входа
const loginValidation = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("Имя пользователя обязательно"),
	body("password").notEmpty().withMessage("Пароль обязателен"),
];

// Вход администратора
router.post("/login", loginValidation, async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Ошибки валидации",
				errors: errors.array(),
			});
		}

		const { username, password } = req.body;

		// Поиск администратора в базе данных
		const admin = await new Promise((resolve, reject) => {
			db.get(
				"SELECT id, username, password FROM admins WHERE username = ?",
				[username],
				(err, row) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		if (!admin) {
			return res.status(401).json({
				success: false,
				message: "Неверные учетные данные",
			});
		}

		// Проверка пароля
		const isPasswordValid = await bcrypt.compare(password, admin.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Неверные учетные данные",
			});
		}

		// Создание JWT токена
		const token = jwt.sign(
			{
				id: admin.id,
				username: admin.username,
				role: "admin",
			},
			JWT_SECRET,
			{ expiresIn: "24h" }
		);

		res.json({
			success: true,
			message: "Успешная авторизация",
			data: {
				token,
				user: {
					id: admin.id,
					username: admin.username,
					role: "admin",
				},
			},
		});
	} catch (error) {
		console.error("Ошибка авторизации:", error);
		res.status(500).json({
			success: false,
			message: "Ошибка сервера при авторизации",
		});
	}
});

// Проверка токена
router.get("/verify", async (req, res) => {
	try {
		const token = req.headers.authorization?.replace("Bearer ", "");

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Токен не предоставлен",
			});
		}

		const decoded = jwt.verify(token, JWT_SECRET);

		res.json({
			success: true,
			data: {
				user: decoded,
			},
		});
	} catch (error) {
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				success: false,
				message: "Недействительный токен",
			});
		}

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "Токен истек",
			});
		}

		console.error("Ошибка проверки токена:", error);
		res.status(500).json({
			success: false,
			message: "Ошибка проверки токена",
		});
	}
});

// Выход (на клиенте просто удаляется токен)
router.post("/logout", (req, res) => {
	res.json({
		success: true,
		message: "Успешный выход",
	});
});

module.exports = router;

