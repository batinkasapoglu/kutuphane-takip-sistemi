import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";

export function registerPdfHandlers() {
  ipcMain.handle("save-pdf-file", async (_event, payload) => {
    const { defaultName = "file.pdf", bytes } = payload || {};
    if (!Array.isArray(bytes)) throw new Error("PDF bytes geçersiz");

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "PDF Kaydet",
      defaultPath: defaultName,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) return { canceled: true };

    const buf = Buffer.from(bytes);
    await fs.writeFile(filePath, buf);

    return { canceled: false, filePath };
  });
}
