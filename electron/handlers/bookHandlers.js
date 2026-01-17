import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import { v4 as uuid } from "uuid";
import { dbRun, dbGet, dbAll, runInTransaction } from "../utils/dbPromise.js";

export function registerBookHandlers() {
  // Add book
  ipcMain.handle("add-book", async (_event, data) => {
    // Get last code
    const row = await dbGet("SELECT code FROM books ORDER BY code DESC LIMIT 1");

    let nextCode = "BK-0001";
    if (row && row.code) {
      const num = parseInt(row.code.split("-")[1]) + 1;
      nextCode = `BK-${num.toString().padStart(4, "0")}`;
    }

    const id = uuid();
    const today = new Date().toISOString().slice(0, 10);

    await dbRun(
      `INSERT INTO books 
        (id, code, title, author, categoryId, publisher, publishYear, pageCount, shelfCode, description, entryDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        nextCode,
        data.title,
        data.author,
        data.categoryId,
        data.publisher,
        data.publishYear,
        data.pageCount,
        data.shelfCode,
        data.description,
        today,
      ]
    );

    return { id, code: nextCode };
  });

  // Get books
  ipcMain.handle("get-books", async (_event, args) => {
  const { search, categoryId, code } = args || {};

  // ✅ isBorrowed alanını ekledik
  let query = `
    SELECT 
      b.*,
      CASE 
        WHEN EXISTS (
          SELECT 1
          FROM borrowings br
          WHERE br.bookId = b.id
            AND br.status = 'borrowed'
        ) THEN 1
        ELSE 0
      END AS isBorrowed
    FROM books b
  `;

  const params = [];
  const conditions = [];

  // 🔹 QR / direkt kod araması (öncelikli)
  if (code) {
    conditions.push("b.code = ?");
    params.push(code);
  } else {
    // 🔹 Serbest metin arama (HER ŞEY)
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(`
        (
          b.title        LIKE ?
          OR b.author     LIKE ?
          OR b.code       LIKE ?
          OR b.shelfCode  LIKE ?
          OR b.publisher  LIKE ?
          OR b.description LIKE ?
        )
      `);
      params.push(q, q, q, q, q, q);
    }

    // 🔹 Kategori filtresi
    if (categoryId) {
      conditions.push("b.categoryId = ?");
      params.push(categoryId);
    }
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // 🔹 Mantıklı sıralama
  query += `
    ORDER BY
      b.title COLLATE NOCASE ASC,
      b.author COLLATE NOCASE ASC,
      b.entryDate DESC
  `;

  const rows = await dbAll(query, params);
  return rows;
});



  // Delete book
  ipcMain.handle("delete-book", async (_event, id) => {
    await dbRun("DELETE FROM books WHERE id = ?", [id]);
    return { success: true };
  });

  // Update book
  ipcMain.handle("update-book", async (_event, book) => {
    await dbRun(
      "UPDATE books SET title = ?, author = ?, categoryId = ? WHERE id = ?",
      [book.title, book.author, book.categoryId, book.id]
    );
    return true;
  });

  // ============================================================
  // ✅ FILE BACKUP: EXPORT BOOKS TO JSON FILE
  // ============================================================
  ipcMain.handle("books-export-to-file", async () => {
    const books = await dbAll("SELECT * FROM books ORDER BY title COLLATE NOCASE ASC");


    const payload = JSON.stringify(
      {
        version: 1,
        type: "books-backup",
        createdAt: new Date().toISOString(),
        count: books.length,
        items: books,
      },
      null,
      2
    );

    const defaultName = `library-books-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Kitap Yedeğini Kaydet",
      defaultPath: defaultName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePath) return { canceled: true };

    await fs.writeFile(filePath, payload, "utf-8");
    return { canceled: false, filePath, count: books.length };
  });

  // ============================================================
  // ✅ FILE BACKUP: IMPORT BOOKS FROM JSON FILE (merge/overwrite)
  // ============================================================
  ipcMain.handle("books-import-from-file", async (_event, opts) => {
    const { mode = "merge" } = opts || {};

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Kitap Yedeği Seç",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = filePaths[0];
    const raw = await fs.readFile(filePath, "utf-8");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Geçersiz JSON dosyası");
    }

    // ✅ 2 formatı da destekle:
    // 1) Bizim format: { version, type, items: [...] }
    // 2) Direkt array: [...]
    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items)) {
      throw new Error("Yedek formatı geçersiz (items bulunamadı)");
    }

    // Basit normalize + minimum doğrulama
    const normalized = items
      .filter((b) => b && typeof b === "object")
      .map((b) => ({
        id: String(b.id ?? ""),
        code: b.code != null ? String(b.code) : null,
        title: String(b.title ?? ""),
        author: String(b.author ?? ""),
        categoryId: String(b.categoryId ?? ""),
        publisher: String(b.publisher ?? ""),
        publishYear: b.publishYear ?? null,
        pageCount: b.pageCount ?? null,
        shelfCode: String(b.shelfCode ?? ""),
        description: String(b.description ?? ""),
        entryDate:
          String(b.entryDate ?? "").slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
      }))
      .filter((b) => b.id && b.title); // minimum şart

    const restored = await runInTransaction(async () => {
      if (mode === "overwrite") {
        await dbRun("DELETE FROM books");
      }

      let count = 0;

      for (const b of normalized) {
        // 1) ID üzerinden upsert
        try {
          await dbRun(
            `
            INSERT INTO books (
              id, code, title, author, categoryId, publisher, publishYear,
              pageCount, shelfCode, description, entryDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              code=excluded.code,
              title=excluded.title,
              author=excluded.author,
              categoryId=excluded.categoryId,
              publisher=excluded.publisher,
              publishYear=excluded.publishYear,
              pageCount=excluded.pageCount,
              shelfCode=excluded.shelfCode,
              description=excluded.description,
              entryDate=excluded.entryDate
          `,
            [
              b.id,
              b.code,
              b.title,
              b.author,
              b.categoryId,
              b.publisher,
              b.publishYear,
              b.pageCount,
              b.shelfCode,
              b.description,
              b.entryDate,
            ]
          );

          count++;
          continue;
        } catch (err) {
          // 2) UNIQUE(code) çakışması => code üzerinden update
          if (!b.code) throw err;

          const existingByCode = await dbGet(
            "SELECT id FROM books WHERE code = ?",
            [b.code]
          );
          if (!existingByCode) throw err;

          await dbRun(
            `
            UPDATE books SET
              title = ?,
              author = ?,
              categoryId = ?,
              publisher = ?,
              publishYear = ?,
              pageCount = ?,
              shelfCode = ?,
              description = ?,
              entryDate = ?
            WHERE code = ?
          `,
            [
              b.title,
              b.author,
              b.categoryId,
              b.publisher,
              b.publishYear,
              b.pageCount,
              b.shelfCode,
              b.description,
              b.entryDate,
              b.code,
            ]
          );

          count++;
        }
      }

      return count;
    });

    return { canceled: false, filePath, restored };
  });
}
