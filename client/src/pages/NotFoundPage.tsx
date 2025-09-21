import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
	return (
		<div className="not-found-page">
			<div className="not-found-content">
				<h1>404</h1>
				<h2>Страница не найдена</h2>
				<p>Запрашиваемая страница не существует.</p>
				<div className="not-found-actions">
					<Link to="/" className="btn btn-primary">
						На главную
					</Link>
					<Link to="/admin" className="btn btn-secondary">
						Панель администратора
					</Link>
				</div>
			</div>
		</div>
	);
};

export default NotFoundPage;
