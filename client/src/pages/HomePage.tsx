import React from "react";
import CreateTaskForm from "../components/CreateTaskForm";
import TaskList from "../components/TaskList";

const HomePage: React.FC = () => {
	return (
		<div className="home-page">
			<main className="page-content">
				<section className="create-task-section">
					<h2>Создать новую задачу</h2>
					<CreateTaskForm />
				</section>

				<section className="tasks-section">
					<h2>Список задач</h2>
					<TaskList />
				</section>
			</main>
		</div>
	);
};

export default HomePage;
