import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initializeDatabase } from "./schema/initDatabase.js";
import { registerBookHandlers } from "./handlers/bookHandlers.js";
import { registerStudentHandlers } from "./handlers/studentHandlers.js";
import { registerCategoryHandlers } from "./handlers/categoryHandlers.js";
import { registerClassHandlers } from "./handlers/classHandlers.js";
import { registerBorrowHandlers } from "./handlers/borrowHandlers.js";
import { registerMiscHandlers } from "./handlers/miscHandlers.js";
import { registerPdfHandlers } from "./handlers/pdfHandlers.js";
import { registerFileHandlers } from "./handlers/fileHandlers.js";

const isDev = !app.isPackaged;

// ✅ ESM'de __dirname yok -> kendimiz tanımlıyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // ✅ Preload'u main dosyasıyla aynı build klasöründen yükle
      // (preload.js build çıktın main ile aynı yerde olmalı)
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // ✅ dist index.html dosyasını doğru yerden yükle
    // main dosyan dist-electron gibi bir klasördeyse bu path genelde doğru olur
    win.loadFile(path.join(__dirname, "../dist/index.html"));

  }
}

app.whenReady().then(async () => {
  createWindow();

  try {
    await initializeDatabase();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }

  registerBookHandlers();
  registerStudentHandlers();
  registerCategoryHandlers();
  registerClassHandlers();
  registerBorrowHandlers();
  registerMiscHandlers();
  registerPdfHandlers();
  registerFileHandlers();

  console.log("All IPC handlers registered");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
