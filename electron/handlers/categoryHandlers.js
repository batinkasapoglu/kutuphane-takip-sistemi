import { ipcMain } from "electron";
import { v4 as uuid } from "uuid";
import { dbRun, dbAll } from "../utils/dbPromise.js";

export function registerCategoryHandlers() {
  // Get categories
  ipcMain.handle("get-categories", async () => {
    const rows = await dbAll("SELECT * FROM categories");
    return rows;
  });

  // Add category
  ipcMain.handle("add-category", async (_event, name) => {
    const id = uuid();
    await dbRun("INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);
    return { id };
  });

  // Update category
  ipcMain.handle("update-category", async (_event, category) => {
    await dbRun("UPDATE categories SET name = ? WHERE id = ?", [
      category.name,
      category.id,
    ]);
    return true;
  });

  // Delete category
  ipcMain.handle("delete-category", async (_event, id) => {
    await dbRun("DELETE FROM categories WHERE id = ?", [id]);
    return true;
  });
}
