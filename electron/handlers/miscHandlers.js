import { ipcMain } from "electron";
import { v4 as uuid } from "uuid";
import { dbRun, dbGet, dbAll } from "../utils/dbPromise.js";

export function registerMiscHandlers() {
  // ========================================
  // LEGACY: Persons handlers (deprecated)
  // Consider removing in future cleanup
  // ========================================
  ipcMain.handle("add-person", async (_event, name) => {
    const id = uuid();
    await dbRun("INSERT INTO persons (id, name) VALUES (?, ?)", [id, name]);
    return { id };
  });

  ipcMain.handle("get-persons", async () => {
    const rows = await dbAll("SELECT * FROM persons");
    return rows;
  });

  // SETTINGS
  ipcMain.handle("get-setting", async (_e, key) => {
    const row = await dbGet("SELECT value FROM settings WHERE key = ?", [key]);
    return row?.value;
  });
  // API: set-setting
  ipcMain.handle("set-setting", async (_e, { key, value }) => {
  if (!key) throw new Error("Setting key boş olamaz");

  await dbRun(
    `INSERT INTO settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, String(value ?? "")]
  );

  return true;
});


  // DASHBOARD STATS
  ipcMain.handle("get-dashboard-stats", async () => {
    const totalBooks = await dbGet("SELECT COUNT(*) as count FROM books");
    const totalStudents = await dbGet("SELECT COUNT(*) as count FROM students");
    const activeBorrowings = await dbGet(
      "SELECT COUNT(*) as count FROM borrowings WHERE status = 'borrowed'"
    );

    return {
      totalBooks: totalBooks.count,
      totalStudents: totalStudents.count,
      activeBorrowings: activeBorrowings.count,
    };
  });
}
