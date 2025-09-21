const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error("Ошибка подключения к базе данных:", err.message);
	} else {
	}
});

const initializeDatabase = () => {
	// Создание таблицы задач
	const createTasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      is_edited_by_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

	// Создание таблицы администраторов
	const createAdminsTable = `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

	db.serialize(() => {
		db.run(createTasksTable);
		db.run(createAdminsTable);

		// Создание администратора по умолчанию
		const adminUsername = "admin";
		const adminPassword = "123";

		db.get(
			"SELECT id FROM admins WHERE username = ?",
			[adminUsername],
			(err, row) => {
				if (err) {
					console.error("Ошибка проверки администратора:", err.message);
					return;
				}

				if (!row) {
					const hashedPassword = bcrypt.hashSync(adminPassword, 10);
					db.run(
						"INSERT INTO admins (username, password) VALUES (?, ?)",
						[adminUsername, hashedPassword],
						(err) => {
							if (err) {
								console.error("Ошибка создания администратора:", err.message);
							} else {
							}
						}
					);
				}
			}
		);
	});
};

module.exports = {
	db,
	initializeDatabase,
};
