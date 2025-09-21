import React, { useEffect } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	useNavigate,
} from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState, AppDispatch } from "./store";
import { verifyToken, setInitialized } from "./store/slices/authSlice";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./App.css";

// Компонент для защищенной главной страницы
const ProtectedHomePage: React.FC = () => {
	const { isAuthenticated } = useSelector((state: RootState) => state.auth);

	// Если администратор авторизован, редиректим на админскую панель
	if (isAuthenticated) {
		return <Navigate to="/admin" replace />;
	}

	return <HomePage />;
};

// Компонент для отслеживания изменений аутентификации
const AuthWatcher: React.FC = () => {
	const navigate = useNavigate();
	const { isAuthenticated } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		// Если пользователь разлогинился, перенаправляем на главную
		// Но не мешаем зайти на страницу логина

		if (!isAuthenticated && window.location.pathname === "/admin") {
			navigate("/login", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	return null;
};

const AppContent: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { isInitialized } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		// Проверяем токен при загрузке приложения
		const token = localStorage.getItem("token");
		if (token) {
			dispatch(verifyToken());
		} else {
			// Если токена нет, сразу помечаем как инициализированный
			dispatch(setInitialized());
		}
	}, [dispatch]);

	// Показываем загрузку до завершения инициализации
	if (!isInitialized) {
		return (
			<div className="loading-container">
				<div className="loading-spinner">Загрузка...</div>
			</div>
		);
	}

	return (
		<Router>
			<div className="App">
				<AuthWatcher />
				<Navigation />

				<main className="app-main">
					<div className="container">
						<Routes>
							<Route path="/" element={<ProtectedHomePage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/admin" element={<AdminPage />} />
							<Route path="*" element={<NotFoundPage />} />
						</Routes>
					</div>
				</main>
			</div>
		</Router>
	);
};

const App: React.FC = () => {
	return (
		<Provider store={store}>
			<AppContent />
		</Provider>
	);
};

export default App;
