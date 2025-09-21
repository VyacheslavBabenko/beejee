import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../store";
import { login, verifyToken, clearError } from "../store/slices/authSlice";
import "./LoginForm.css";

interface LoginData {
	username: string;
	password: string;
}

interface LoginErrors {
	username?: string;
	password?: string;
	general?: string;
}

const LoginForm: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { loading, error, isAuthenticated } = useSelector(
		(state: RootState) => state.auth
	);

	const [loginData, setLoginData] = useState<LoginData>({
		username: "",
		password: "",
	});

	const [errors, setErrors] = useState<LoginErrors>({});

	// Проверяем токен при загрузке компонента
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token && !isAuthenticated) {
			dispatch(verifyToken());
		}
	}, [dispatch, isAuthenticated]);

	const validateForm = (): boolean => {
		const newErrors: LoginErrors = {};

		if (!loginData.username.trim()) {
			newErrors.username = "Имя пользователя обязательно";
		}

		if (!loginData.password.trim()) {
			newErrors.password = "Пароль обязателен";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setLoginData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Очищаем ошибки при изменении полей
		if (errors[name as keyof LoginErrors]) {
			setErrors((prev) => ({
				...prev,
				[name]: undefined,
			}));
		}

		// Очищаем общую ошибку
		if (error) {
			dispatch(clearError());
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			await dispatch(login(loginData)).unwrap();
			// После успешного входа перенаправляем на админскую панель
			navigate("/admin");
		} catch (error) {
			// Ошибка уже обработана в slice
		}
	};

	if (!isAuthenticated) {
		return (
			<div className="login-form-container">
				<h2>Вход для администратора</h2>

				{error && <div className="error-message general-error">{error}</div>}

				<form onSubmit={handleSubmit} className="login-form">
					<div className="form-group">
						<label htmlFor="username">Имя пользователя</label>
						<input
							type="text"
							id="username"
							name="username"
							value={loginData.username}
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
						<label htmlFor="password">Пароль</label>
						<input
							type="password"
							id="password"
							name="password"
							value={loginData.password}
							onChange={handleInputChange}
							className={errors.password ? "error" : ""}
							placeholder="Введите пароль"
							disabled={loading}
						/>
						{errors.password && (
							<span className="error-message">{errors.password}</span>
						)}
					</div>

					<button type="submit" className="submit-button" disabled={loading}>
						{loading ? "Вход..." : "Войти"}
					</button>
				</form>
			</div>
		);
	}
	return null;
};

export default LoginForm;
