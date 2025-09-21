import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";

export interface User {
	id: number;
	username: string;
	role: string;
}

export interface ApiError {
	message: string;
	success?: boolean;
}

export interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
	error: string | null;
	isAuthenticated: boolean;
	isInitialized: boolean;
}

const initialState: AuthState = {
	user: null,
	token: localStorage.getItem("token"),
	loading: false,
	error: null,
	isAuthenticated: false,
	isInitialized: false,
};

// Асинхронные действия
export const login = createAsyncThunk<
	any,
	{ username: string; password: string },
	{ rejectValue: ApiError }
>("auth/login", async (credentials, { rejectWithValue }) => {
	try {
		const response = await api.post("/auth/login", credentials);
		return response.data;
	} catch (error: any) {
		// Передаем сообщение об ошибке от сервера
		return rejectWithValue(
			error.response?.data || { message: "Ошибка авторизации" }
		);
	}
});

export const verifyToken = createAsyncThunk<
	any,
	void,
	{ rejectValue: ApiError }
>("auth/verifyToken", async (_, { rejectWithValue }) => {
	try {
		const response = await api.get("/auth/verify");
		return response.data;
	} catch (error: any) {
		return rejectWithValue(
			error.response?.data || { message: "Ошибка проверки токена" }
		);
	}
});

export const logout = createAsyncThunk(
	"auth/logout",
	async (_, { rejectWithValue }) => {
		try {
			await api.post("/auth/logout");
			return null;
		} catch (error: any) {
			// Даже если сервер вернул ошибку, мы все равно разлогиниваем пользователя
			return null;
		}
	}
);

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		setToken: (state, action: PayloadAction<string>) => {
			state.token = action.payload;
			localStorage.setItem("token", action.payload);
		},
		clearAuth: (state) => {
			state.user = null;
			state.token = null;
			state.isAuthenticated = false;
			localStorage.removeItem("token");
		},
		setInitialized: (state) => {
			state.isInitialized = true;
		},
	},
	extraReducers: (builder) => {
		builder
			// Login
			.addCase(login.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.data.user;
				state.token = action.payload.data.token;
				state.isAuthenticated = true;
				localStorage.setItem("token", action.payload.data.token);
			})
			.addCase(login.rejected, (state, action) => {
				state.loading = false;
				// Извлекаем сообщение из ответа сервера
				const errorMessage =
					action.payload?.message ||
					action.error.message ||
					"Ошибка авторизации";
				state.error = errorMessage;
				state.isAuthenticated = false;
			})
			// Verify token
			.addCase(verifyToken.pending, (state) => {
				state.loading = true;
			})
			.addCase(verifyToken.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.data.user;
				state.isAuthenticated = true;
				state.isInitialized = true;
			})
			.addCase(verifyToken.rejected, (state, action) => {
				state.loading = false;
				state.user = null;
				state.token = null;
				state.isAuthenticated = false;
				state.isInitialized = true;
				// Очищаем токен при любой ошибке проверки токена
				localStorage.removeItem("token");
			})
			// Logout
			.addCase(logout.fulfilled, (state) => {
				state.user = null;
				state.token = null;
				state.isAuthenticated = false;
				localStorage.removeItem("token");
			});
	},
});

export const { clearError, setToken, clearAuth, setInitialized } =
	authSlice.actions;
export default authSlice.reducer;
