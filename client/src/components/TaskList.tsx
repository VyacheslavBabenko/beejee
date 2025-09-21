import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchTasks, setSorting } from "../store/slices/tasksSlice";
import { Task } from "../store/slices/tasksSlice";
import TaskItem from "./TaskItem";
import Pagination from "./Pagination";
import "./TaskList.css";

const TaskList: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { tasks, pagination, loading, error, sortBy, sortOrder } = useSelector(
		(state: RootState) => state.tasks
	);

	useEffect(() => {
		dispatch(
			fetchTasks({
				page: pagination.currentPage,
				sortBy,
				sortOrder,
			})
		);
	}, [dispatch, pagination.currentPage, sortBy, sortOrder]);

	const handleSort = (field: string) => {
		const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
		dispatch(setSorting({ sortBy: field, sortOrder: newOrder }));
	};

	const getSortIcon = (field: string) => {
		if (sortBy !== field) return "↕️";
		return sortOrder === "asc" ? "↑" : "↓";
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-spinner"></div>
				<p>Загрузка задач...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="error-container">
				<p className="error-message">{error}</p>
			</div>
		);
	}

	return (
		<div className="task-list-container">
			<div className="task-list-header">
				<h2>Список задач</h2>
				<div className="sort-controls">
					<span>Сортировка:</span>
					<button
						className={`sort-button ${sortBy === "username" ? "active" : ""}`}
						onClick={() => handleSort("username")}
					>
						Имя {getSortIcon("username")}
					</button>
					<button
						className={`sort-button ${sortBy === "email" ? "active" : ""}`}
						onClick={() => handleSort("email")}
					>
						Email {getSortIcon("email")}
					</button>
					<button
						className={`sort-button ${sortBy === "status" ? "active" : ""}`}
						onClick={() => handleSort("status")}
					>
						Статус {getSortIcon("status")}
					</button>
				</div>
			</div>

			<div className="task-list">
				{tasks.length === 0 ? (
					<div className="no-tasks">
						<p>Задач пока нет. Создайте первую задачу!</p>
					</div>
				) : (
					tasks.map((task: Task) => <TaskItem key={task.id} task={task} />)
				)}
			</div>

			{pagination.totalPages > 1 && (
				<Pagination
					currentPage={pagination.currentPage}
					totalPages={pagination.totalPages}
					onPageChange={(page) => {
						dispatch(
							fetchTasks({
								page,
								sortBy,
								sortOrder,
							})
						);
					}}
				/>
			)}
		</div>
	);
};

export default TaskList;
