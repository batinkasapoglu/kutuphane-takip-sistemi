import sqlite3 from "sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "url";
import { app } from "electron";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

const dbPath = isDev
  ? path.join(process.cwd(), "database", "library.db")
  : path.join(app.getPath("userData"), "library.db");

// ✅ PROD için klasör garanti altına al
if (!isDev) {
  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database opening error:", err);
  } else {
    console.log("Database opened at:", dbPath);
  }
});
