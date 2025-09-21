import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { createTask, fetchTasks } from "../store/slices/tasksSlice";
import "./CreateTaskForm.css";

interface FormData {
	username: string;
	email: string;
	text: string;
}

interface FormErrors {
	username?: string;
	email?: string;
	text?: string;
}

const CreateTaskForm: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { loading, pagination, sortBy, sortOrder } = useSelector(
		(state: RootState) => state.tasks
	);

	const [formData, setFormData] = useState<FormData>({
		username: "",
		email: "",
		text: "",
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [showSuccess, setShowSuccess] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		if (!formData.username.trim()) {
			newErrors.username = "Имя пользователя обязательно";
		} else if (formData.username.length > 100) {
			newErrors.username = "Имя пользователя не должно превышать 100 символов";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email обязателен";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Введите корректный email";
		}

		if (!formData.text.trim()) {
			newErrors.text = "Текст задачи обязателен";
		} else if (formData.text.length > 1000) {
			newErrors.text = "Текст задачи не должен превышать 1000 символов";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Очищаем ошибку при изменении поля
		if (errors[name as keyof FormErrors]) {
			setErrors((prev) => ({
				...prev,
				[name]: undefined,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			await dispatch(createTask(formData)).unwrap();

			// Сброс формы
			setFormData({
				username: "",
				email: "",
				text: "",
			});

			// Обновляем список задач
			dispatch(
				fetchTasks({
					page: pagination.currentPage,
					sortBy,
					sortOrder,
				})
			);

			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 3000);
		} catch (error) {
			console.error("Ошибка создания задачи:", error);
		}
	};

	return (
		<div className="create-task-form-container">
			<h2>Создать новую задачу</h2>

			{showSuccess && (
				<div className="success-message">✅ Задача успешно создана!</div>
			)}

			<form onSubmit={handleSubmit} className="create-task-form">
				<div className="form-group">
					<label htmlFor="username">Имя пользователя *</label>
					<input
						type="text"
						id="username"
						name="username"
						value={formData.username}
						onChange={handleInputChange}
						className={errors.username ? "error" : ""}
						placeholder="Введите имя пользователя"
						disabled={loading}
					/>
					{errors.username && (
						<span className="error-message">{errors.username}</span>
					)}
				</div>

				<div className="form-group">
					<label htmlFor="email">Email *</label>
					<input
						type="email"
						id="email"
						name="email"
						value={formData.email}
						onChange={handleInputChange}
						className={errors.email ? "error" : ""}
						placeholder="Введите email"
						disabled={loading}
					/>
					{errors.email && (
						<span className="error-message">{errors.email}</span>
					)}
				</div>

				<div className="form-group">
					<label htmlFor="text">Текст задачи *</label>
					<textarea
						id="text"
						name="text"
						value={formData.text}
						onChange={handleInputChange}
						className={errors.text ? "error" : ""}
						placeholder="Введите описание задачи"
						rows={4}
						disabled={loading}
					/>
					{errors.text && <span className="error-message">{errors.text}</span>}
				</div>

				<button type="submit" className="submit-button" disabled={loading}>
					{loading ? "Создание..." : "Создать задачу"}
				</button>
			</form>
		</div>
	);
};

export default CreateTaskForm;
