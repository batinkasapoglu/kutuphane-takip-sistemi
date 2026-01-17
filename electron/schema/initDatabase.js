import { db } from "../db.js";

/**
 * Initialize all database tables sequentially to avoid race conditions.
 * Each table creation waits for the previous one to complete.
 */
export async function initializeDatabase() {
  const runAsync = (sql) => {
    return new Promise((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  // BOOKS TABLE
  await runAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      title TEXT,
      author TEXT,
      categoryId TEXT,
      publisher TEXT,
      publishYear INTEGER,
      pageCount INTEGER,
      shelfCode TEXT,
      description TEXT,
      entryDate TEXT
    )`);
  console.log("Books table ready.");

  // PERSONS TABLE (legacy)
  await runAsync(`
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
  console.log("Persons table ready.");

  // CATEGORIES TABLE
  await runAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
  console.log("Categories table ready.");

  // SETTINGS TABLE
  await runAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
  console.log("Settings table ready.");

  // CLASSES TABLE
  await runAsync(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
  console.log("Classes table ready.");

  // STUDENTS TABLE
  await runAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      fullName TEXT,
      classId TEXT,
      schoolNumber TEXT
    )`);
  console.log("Students table ready.");

  // BORROWINGS TABLE
  await runAsync(`
    CREATE TABLE IF NOT EXISTS borrowings (
      id TEXT PRIMARY KEY,
      bookId TEXT,
      studentId TEXT,
      borrowDate TEXT,
      returnDate TEXT,
      status TEXT
    )`);
  console.log("Borrowings table ready.");

  // Insert default settings
  await runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('borrow_limit_days', '15')`
  );

  await runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('warning_days_before', '3')`
  );

  console.log("Database initialization complete.");
}
