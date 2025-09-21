import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { clearAuth } from "../store/slices/authSlice";
import "./Navigation.css";

const Navigation: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const location = useLocation();
	const { isAuthenticated, user } = useSelector(
		(state: RootState) => state.auth
	);

	const handleLogout = () => {
		dispatch(clearAuth());
	};

	return (
		<nav className="navigation">
			<div className="nav-container">
				<div className="nav-links">
					{!isAuthenticated && (
						<>
							<Link
								to="/"
								className={`nav-link ${
									location.pathname === "/" ? "active" : ""
								}`}
							>
								Главная
							</Link>
							<Link
								to="/login"
								className={`nav-link ${
									location.pathname === "/login" ? "active" : ""
								}`}
							>
								Вход
							</Link>
						</>
					)}
					{isAuthenticated && (
						<Link
							to="/admin"
							className={`nav-link ${
								location.pathname === "/admin" ? "active" : ""
							}`}
						>
							Панель админа
						</Link>
					)}
				</div>

				{isAuthenticated && (
					<div className="nav-user">
						<span className="user-info">Привет, {user?.username}!</span>

						<button onClick={handleLogout} className="logout-button">
							Выйти
						</button>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navigation;
