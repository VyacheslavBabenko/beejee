import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { updateTask, fetchTasks } from "../store/slices/tasksSlice";
import { clearAuth } from "../store/slices/authSlice";
import { Task } from "../store/slices/tasksSlice";
import "./TaskItem.css";

interface TaskItemProps {
	task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
	const dispatch = useDispatch<AppDispatch>();
	const { isAuthenticated } = useSelector((state: RootState) => state.auth);
	const { pagination, sortBy, sortOrder } = useSelector(
		(state: RootState) => state.tasks
	);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState(task.text);
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleStatusToggle = async () => {
		if (!isAuthenticated) return;

		setIsUpdating(true);
		setError(null);
		try {
			await dispatch(
				updateTask({
					id: task.id,
					taskData: {
						status: task.status === "completed" ? "pending" : "completed",
					},
				})
			).unwrap();

			// Обновляем список задач
			dispatch(
				fetchTasks({
					page: pagination.currentPage,
					sortBy,
					sortOrder,
				})
			);
		} catch (error: any) {
			console.error("Ошибка обновления статуса:", error);
			// Если 401 ошибка, разлогиниваем пользователя
			if (error?.response?.status === 401) {
				dispatch(clearAuth());
				setError("Сессия истекла. Пожалуйста, войдите в систему заново.");
			} else {
				setError("Ошибка обновления статуса задачи");
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const handleEdit = () => {
		if (!isAuthenticated) return;
		setIsEditing(true);
		setEditText(task.text);
	};

	const handleSave = async () => {
		if (!isAuthenticated) return;

		setIsUpdating(true);
		setError(null);
		try {
			await dispatch(
				updateTask({
					id: task.id,
					taskData: { text: editText },
				})
			).unwrap();

			// Обновляем список задач
			dispatch(
				fetchTasks({
					page: pagination.currentPage,
					sortBy,
					sortOrder,
				})
			);

			setIsEditing(false);
		} catch (error: any) {
			console.error("Ошибка обновления задачи:", error);
			// Если 401 ошибка, разлогиниваем пользователя
			if (error?.response?.status === 401) {
				dispatch(clearAuth());
				setError("Сессия истекла. Пожалуйста, войдите в систему заново.");
			} else {
				setError("Ошибка обновления задачи");
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditText(task.text);
	};

	return (
		<div
			className={`task-item ${task.status === "completed" ? "completed" : ""}`}
		>
			<div className="task-header">
				<div className="task-user-info">
					<h3 className="task-username">{task.username}</h3>
					<span className="task-email">{task.email}</span>
				</div>
				<div className="task-status">
					<span className={`status-badge ${task.status}`}>
						{task.status === "completed" ? "Выполнено" : "В работе"}
					</span>
					{task.is_edited_by_admin && (
						<span className="edited-badge">
							Отредактировано администратором
						</span>
					)}
				</div>
			</div>

			<div className="task-content">
				{isEditing ? (
					<div className="edit-form">
						<textarea
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
							className="edit-textarea"
							rows={3}
							disabled={isUpdating}
						/>
						<div className="edit-actions">
							<button
								onClick={handleSave}
								disabled={isUpdating || !editText.trim()}
								className="save-button"
							>
								{isUpdating ? "Сохранение..." : "Сохранить"}
							</button>
							<button
								onClick={handleCancel}
								disabled={isUpdating}
								className="cancel-button"
							>
								Отмена
							</button>
						</div>
					</div>
				) : (
					<p className="task-text">{task.text}</p>
				)}

				{error && <div className="error-message">{error}</div>}
			</div>

			<div className="task-footer">
				<div className="task-dates"></div>

				{isAuthenticated && (
					<div className="task-actions">
						<button
							onClick={handleStatusToggle}
							disabled={isUpdating}
							className={`status-button ${
								task.status === "completed" ? "uncomplete" : "complete"
							}`}
						>
							{task.status === "completed"
								? "Отметить невыполненной"
								: "Отметить выполненной"}
						</button>
						<button
							onClick={handleEdit}
							disabled={isUpdating}
							className="edit-button"
						>
							Редактировать
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default TaskItem;
