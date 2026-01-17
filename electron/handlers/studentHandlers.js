import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import { v4 as uuid } from "uuid";
import { dbRun, dbGet, dbAll, runInTransaction } from "../utils/dbPromise.js";

export function registerStudentHandlers() {
  // ✅ Get students (search + class filter)
  ipcMain.handle("get-students", async (_event, args) => {
    const { search, classId } = args || {};

    let query = "SELECT * FROM students";
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push("(fullName LIKE ? OR schoolNumber LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (classId) {
      conditions.push("classId = ?");
      params.push(classId);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY fullName ASC";

    return await dbAll(query, params);
  });

  // ✅ Add student
  ipcMain.handle("add-student", async (_event, data) => {
    const id = uuid();
    await dbRun(
      `INSERT INTO students (id, fullName, classId, schoolNumber) VALUES (?, ?, ?, ?)`,
      [id, data.fullName, data.classId, data.schoolNumber || ""]
    );
    return { id };
  });

  // ✅ Update student
  ipcMain.handle("update-student", async (_event, student) => {
    await dbRun(
      `UPDATE students SET fullName = ?, classId = ?, schoolNumber = ? WHERE id = ?`,
      [student.fullName, student.classId, student.schoolNumber || "", student.id]
    );
    return true;
  });

  // ✅ Delete student
  ipcMain.handle("delete-student", async (_event, id) => {
    await dbRun(`DELETE FROM students WHERE id = ?`, [id]);
    return true;
  });

  // ============================================================
  // ✅ FILE BACKUP: EXPORT STUDENTS TO JSON FILE
  // ============================================================
  ipcMain.handle("students-export-to-file", async () => {
    const students = await dbAll(`
  SELECT
    s.id,
    s.fullName,
    s.classId,
    s.schoolNumber,
    c.name AS className
  FROM students s
  LEFT JOIN classes c ON c.id = s.classId
  ORDER BY s.fullName COLLATE NOCASE ASC
`);


    const payload = JSON.stringify(
      {
        version: 1,
        type: "students-backup",
        createdAt: new Date().toISOString(),
        count: students.length,
        items: students,
      },
      null,
      2
    );

    const defaultName = `library-students-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Öğrenci Yedeğini Kaydet",
      defaultPath: defaultName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePath) return { canceled: true };

    await fs.writeFile(filePath, payload, "utf-8");
    return { canceled: false, filePath, count: students.length };
  });

  // ============================================================
  // ✅ FILE BACKUP: IMPORT STUDENTS FROM JSON FILE (merge/overwrite)
  // ============================================================
  ipcMain.handle("students-import-from-file", async (_event, opts) => {
    const { mode = "merge" } = opts || {};

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Öğrenci Yedeği Seç",
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

    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items)) {
      throw new Error("Yedek formatı geçersiz (items bulunamadı)");
    }

    // Normalize + minimum doğrulama
    const normalized = items
      .filter((s) => s && typeof s === "object")
      .map((s) => ({
        id: String(s.id ?? ""),
        fullName: String(s.fullName ?? "").trim(),
        classId: String(s.classId ?? ""),
        schoolNumber: String(s.schoolNumber ?? ""),
        className: String(s.className ?? "").trim(),

      }))
      .filter((s) => s.id && s.fullName && s.classId);

    const restored = await runInTransaction(async () => {
      // 1) ✅ Ensure classes exist (auto-create from student backup)
      for (const s of normalized) {
        if (!s.classId) continue;

        // className yoksa en azından "Bilinmeyen Sınıf" koy
        const name = s.className || "Bilinmeyen Sınıf";

        await dbRun(
          `
    INSERT INTO classes (id, name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = CASE
        WHEN classes.name IS NULL OR classes.name = '' OR classes.name = 'Bilinmeyen Sınıf'
        THEN excluded.name
        ELSE classes.name
      END
    `,
          [s.classId, name]
        );
      }

      if (mode === "overwrite") {
        await dbRun("DELETE FROM students");
      }

      let count = 0;

      for (const s of normalized) {
        await dbRun(
          `
          INSERT INTO students (id, fullName, classId, schoolNumber)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            fullName=excluded.fullName,
            classId=excluded.classId,
            schoolNumber=excluded.schoolNumber
        `,
          [s.id, s.fullName, s.classId, s.schoolNumber]
        );
        count++;
      }

      return count;
    });

    return { canceled: false, filePath, restored };
  });
}
