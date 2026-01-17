import { ipcMain } from "electron";
import { v4 as uuid } from "uuid";
import { runInTransaction, dbRun, dbAll } from "../utils/dbPromise.js";
import { dialog } from "electron";
import fs from "node:fs/promises";

// Reusable SQL query for getting classes sorted by grade number and section
const GET_CLASSES_SORTED_SQL = `
  SELECT id, name
  FROM (
    SELECT
      id,
      name,
      (length(name) - length(ltrim(name, '0123456789'))) AS digitLen,
      CASE
        WHEN (length(name) - length(ltrim(name, '0123456789'))) > 0
        THEN CAST(substr(name, 1, (length(name) - length(ltrim(name, '0123456789')))) AS INTEGER)
        ELSE NULL
      END AS gradeNum,
      CASE
        WHEN (length(name) - length(ltrim(name, '0123456789'))) > 0
        THEN
          CASE
            -- kalan kısım "-A" gibi başlıyorsa "-" kaldır
            WHEN substr(trim(substr(name, (length(name) - length(ltrim(name, '0123456789'))) + 1)), 1, 1) = '-'
            THEN trim(substr(trim(substr(name, (length(name) - length(ltrim(name, '0123456789'))) + 1)), 2))
            ELSE trim(substr(name, (length(name) - length(ltrim(name, '0123456789'))) + 1))
          END
        ELSE name
      END AS section
    FROM classes
  )
  ORDER BY
    CASE WHEN gradeNum IS NOT NULL THEN 0 ELSE 1 END,
    gradeNum,
    section COLLATE NOCASE,
    name COLLATE NOCASE
`;

export function registerClassHandlers() {
  // Get classes
  ipcMain.handle("get-classes", async () => {
    const rows = await dbAll(GET_CLASSES_SORTED_SQL);
    return rows;
  });

  // Add class
  ipcMain.handle("add-class", async (_event, name) => {
    const id = uuid();
    await dbRun("INSERT INTO classes (id, name) VALUES (?, ?)", [id, name]);
    return { id };
  });

  // Delete class
  ipcMain.handle("delete-class", async (_event, id) => {
    await dbRun("DELETE FROM classes WHERE id = ?", [id]);
    return true;
  });

  // Update class
  ipcMain.handle("update-class", async (_e, cls) => {
    await dbRun("UPDATE classes SET name = ? WHERE id = ?", [cls.name, cls.id]);
    return true;
  });

  // Export classes to file
  ipcMain.handle("classes-export-to-file", async () => {
    const classes = await dbAll(GET_CLASSES_SORTED_SQL);

    const payload = JSON.stringify(
      {
        version: 1,
        type: "classes-backup",
        createdAt: new Date().toISOString(),
        count: classes.length,
        items: classes,
      },
      null,
      2
    );

    const defaultName = `library-classes-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Sınıf Yedeğini Kaydet",
      defaultPath: defaultName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePath) return { canceled: true };

    await fs.writeFile(filePath, payload, "utf-8");
    return { canceled: false, filePath, count: classes.length };
  });

  // Import classes from file
  ipcMain.handle("classes-import-from-file", async (_event, opts) => {
    const { mode = "merge" } = opts || {};

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Sınıf Yedeği Seç",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (canceled || !filePaths?.length) return { canceled: true };

    const raw = await fs.readFile(filePaths[0], "utf-8");
    const parsed = JSON.parse(raw);

    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items)) throw new Error("Yedek formatı geçersiz (items yok)");

    const normalized = items
      .filter((c) => c && typeof c === "object")
      .map((c) => ({
        id: String(c.id ?? ""),
        name: String(c.name ?? "").trim(),
      }))
      .filter((c) => c.id && c.name);

    const restored = await runInTransaction(async () => {
      if (mode === "overwrite") {
        await dbRun("DELETE FROM classes");
      }

      let count = 0;
      for (const c of normalized) {
        await dbRun(
          `
        INSERT INTO classes (id, name)
        VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name
      `,
          [c.id, c.name]
        );
        count++;
      }
      return count;
    });

    return { canceled: false, filePath: filePaths[0], restored };
  });
}
