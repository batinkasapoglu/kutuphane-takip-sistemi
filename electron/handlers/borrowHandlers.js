import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import { v4 as uuid } from "uuid";
import { runInTransaction, dbRun, dbAll, dbGet } from "../utils/dbPromise.js";

export function registerBorrowHandlers() {
  // Borrow book
  ipcMain.handle("borrow-book", async (_e, data) => {
    const { bookId, studentId } = data || {};

    if (!bookId || !studentId) {
      throw new Error("Eksik veri (bookId / studentId)");
    }

    // ✅ 1) Bu kitap şu anda ödünçte mi?
    const active = await dbGet(
      `SELECT id FROM borrowings
     WHERE bookId = ? AND status = 'borrowed'
     LIMIT 1`,
      [bookId]
    );

    if (active) {
      // ❌ Kitap zaten ödünçte
      return {
        ok: false,
        reason: "BOOK_ALREADY_BORROWED",
      };
    }

    // ✅ 2) Ödünç verilebilir → ekle
    const id = uuid();
    const date = new Date().toISOString().slice(0, 10);

    await dbRun(
      `INSERT INTO borrowings
     (id, bookId, studentId, borrowDate, returnDate, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [id, bookId, studentId, date, null, "borrowed"]
    );

    return {
      ok: true,
      id,
    };
  });


  // Get active borrowings with details
  ipcMain.handle("get-active-borrowings", async () => {
    const rows = await dbAll(
      `SELECT 
        b.id, 
        b.bookId, 
        b.studentId, 
        b.borrowDate,
        bk.title as bookTitle, 
        bk.author as bookAuthor,
        s.fullName as studentName, 
        c.name as className
       FROM borrowings b
       LEFT JOIN books bk ON b.bookId = bk.id
       LEFT JOIN students s ON b.studentId = s.id
       LEFT JOIN classes c ON s.classId = c.id
       WHERE b.status = 'borrowed'
       ORDER BY b.borrowDate ASC`
    );
    return rows;
  });

  // Return book
  ipcMain.handle("return-book", async (_e, id) => {
    const today = new Date().toISOString().slice(0, 10);

    await dbRun(
      `UPDATE borrowings
       SET status = 'returned', returnDate = ?
       WHERE id = ?`,
      [today, id]
    );

    return true;
  });
  ipcMain.handle("borrowings-export-to-file", async () => {
    const rows = await dbAll("SELECT * FROM borrowings ORDER BY borrowDate DESC");

    const payload = JSON.stringify(
      {
        version: 1,
        type: "borrowings-backup",
        createdAt: new Date().toISOString(),
        count: rows.length,
        items: rows,
      },
      null,
      2
    );

    const defaultName = `library-borrowings-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Ödünçler Yedeğini Kaydet",
      defaultPath: defaultName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePath) return { canceled: true };

    await fs.writeFile(filePath, payload, "utf-8");
    return { canceled: false, filePath, count: rows.length };
  });
  ipcMain.handle("borrowings-import-from-file", async (_event, opts) => {
    const { mode = "merge" } = opts || {};

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Ödünçler Yedeği Seç",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePaths?.length) return { canceled: true };

    const raw = await fs.readFile(filePaths[0], "utf-8");
    const parsed = JSON.parse(raw);

    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items)) throw new Error("Yedek formatı geçersiz (items yok)");

    const normalized = items
      .filter((b) => b && typeof b === "object")
      .map((b) => ({
        id: String(b.id ?? ""),
        bookId: String(b.bookId ?? ""),
        studentId: String(b.studentId ?? ""),
        borrowDate: String(b.borrowDate ?? ""),
        returnDate: b.returnDate == null ? null : String(b.returnDate),
        status: String(b.status ?? ""),
      }))
      .filter((b) => b.id && b.bookId && b.studentId && b.borrowDate);

    const restored = await runInTransaction(async () => {
      if (mode === "overwrite") {
        await dbRun("DELETE FROM borrowings");
      }

      let count = 0;
      for (const b of normalized) {
        await dbRun(
          `
        INSERT INTO borrowings (id, bookId, studentId, borrowDate, returnDate, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          bookId=excluded.bookId,
          studentId=excluded.studentId,
          borrowDate=excluded.borrowDate,
          returnDate=excluded.returnDate,
          status=excluded.status
      `,
          [b.id, b.bookId, b.studentId, b.borrowDate, b.returnDate, b.status]
        );
        count++;
      }
      return count;
    });

    return { canceled: false, filePath: filePaths[0], restored };
  });

}
