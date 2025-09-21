const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const taskRoutes = require("./routes/tasks");
const authRoutes = require("./routes/auth");
const { initializeDatabase } = require("./database/init");

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"],
			},
		},
	})
);

// CORS configuration
app.use(
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? process.env.FRONTEND_URL || "https://your-app.railway.app"
				: "http://localhost:3000",
		credentials: true,
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize database
initializeDatabase();

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "client/build")));

	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "client/build", "index.html"));
	});
}

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		success: false,
		message: "Внутренняя ошибка сервера",
	});
});

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({
		success: false,
		message: "Маршрут не найден",
	});
});

app.listen(PORT, () => {});
