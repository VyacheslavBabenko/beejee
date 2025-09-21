const jwt = require("jsonwebtoken");

const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware для проверки авторизации администратора
const authenticateAdmin = (req, res, next) => {
	try {
		const token = req.headers.authorization?.replace("Bearer ", "");

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Требуется авторизация",
			});
		}

		const decoded = jwt.verify(token, JWT_SECRET);

		if (decoded.role !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Доступ запрещен. Требуются права администратора",
			});
		}

		req.user = decoded;
		next();
	} catch (error) {
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				success: false,
				message: "Недействительный токен",
			});
		}

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "Токен истек. Требуется повторная авторизация",
			});
		}

		console.error("Ошибка проверки токена:", error);
		res.status(500).json({
			success: false,
			message: "Ошибка проверки авторизации",
		});
	}
};

module.exports = {
	authenticateAdmin,
};

