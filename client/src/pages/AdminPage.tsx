import React from "react";
import TaskList from "../components/TaskList";

const AdminPage: React.FC = () => {
	return (
		<div className="admin-page">
			<div className="page-content">
				<div className="content-section">
					<h2>Управление задачами</h2>
					<TaskList />
				</div>
			</div>
		</div>
	);
};

export default AdminPage;
