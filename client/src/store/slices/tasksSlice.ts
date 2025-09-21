import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";

export interface Task {
	id: number;
	username: string;
	email: string;
	text: string;
	status: "pending" | "completed";
	is_edited_by_admin: boolean;
	created_at: string;
	updated_at: string;
}

export interface Pagination {
	currentPage: number;
	totalPages: number;
	totalTasks: number;
	limit: number;
}

export interface TasksState {
	tasks: Task[];
	pagination: Pagination;
	loading: boolean;
	error: string | null;
	sortBy: string;
	sortOrder: "asc" | "desc";
}

const initialState: TasksState = {
	tasks: [],
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalTasks: 0,
		limit: 3,
	},
	loading: false,
	error: null,
	sortBy: "created_at",
	sortOrder: "desc",
};

// Асинхронные действия
export const fetchTasks = createAsyncThunk(
	"tasks/fetchTasks",
	async (
		params: { page?: number; sortBy?: string; sortOrder?: string } = {}
	) => {
		const response = await api.get("/tasks", { params });
		return response.data;
	}
);

export const createTask = createAsyncThunk(
	"tasks/createTask",
	async (taskData: { username: string; email: string; text: string }) => {
		const response = await api.post("/tasks", taskData);
		return response.data;
	}
);

export const updateTask = createAsyncThunk<
	any,
	{
		id: number;
		taskData: { text?: string; status?: string };
	},
	{ rejectValue: any }
>("tasks/updateTask", async ({ id, taskData }, { rejectWithValue }) => {
	try {
		const response = await api.put(`/tasks/${id}`, taskData);
		return response.data;
	} catch (error: any) {
		return rejectWithValue(
			error.response?.data || { message: "Ошибка обновления задачи" }
		);
	}
});

export const fetchTaskById = createAsyncThunk(
	"tasks/fetchTaskById",
	async (id: number) => {
		const response = await api.get(`/tasks/${id}`);
		return response.data;
	}
);

const tasksSlice = createSlice({
	name: "tasks",
	initialState,
	reducers: {
		setSorting: (
			state,
			action: PayloadAction<{ sortBy: string; sortOrder: "asc" | "desc" }>
		) => {
			state.sortBy = action.payload.sortBy;
			state.sortOrder = action.payload.sortOrder;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch tasks
			.addCase(fetchTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload.data.tasks;
				state.pagination = action.payload.data.pagination;
			})
			.addCase(fetchTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Ошибка загрузки задач";
			})
			// Create task
			.addCase(createTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createTask.fulfilled, (state, action) => {
				state.loading = false;
				// Добавляем новую задачу в начало списка
				if (action.payload.success && action.payload.task) {
					state.tasks.unshift(action.payload.task);
					state.pagination.totalTasks += 1;
					// Пересчитываем общее количество страниц
					state.pagination.totalPages = Math.ceil(
						state.pagination.totalTasks / state.pagination.limit
					);
				}
			})
			.addCase(createTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Ошибка создания задачи";
			})
			// Update task
			.addCase(updateTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateTask.fulfilled, (state, action) => {
				state.loading = false;
				// Обновляем задачу в списке
				if (action.payload.success) {
					// Находим и обновляем задачу в списке
					const taskIndex = state.tasks.findIndex(
						(task) => task.id === action.meta.arg.id
					);
					if (taskIndex !== -1) {
						// Обновляем только измененные поля
						const updatedTask = { ...state.tasks[taskIndex] };
						if (action.meta.arg.taskData.text !== undefined) {
							updatedTask.text = action.meta.arg.taskData.text;
							updatedTask.is_edited_by_admin = true;
						}
						if (action.meta.arg.taskData.status !== undefined) {
							updatedTask.status = action.meta.arg.taskData.status as
								| "pending"
								| "completed";
						}
						state.tasks[taskIndex] = updatedTask;
					}
				}
			})
			.addCase(updateTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.payload?.message ||
					action.error.message ||
					"Ошибка обновления задачи";
			});
	},
});

export const { setSorting, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
