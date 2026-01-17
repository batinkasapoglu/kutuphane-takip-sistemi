import { ipcMain, dialog } from "electron";
import fs from "node:fs/promises";

export function registerFileHandlers() {
  ipcMain.handle("save-pdf-file", async (_e, { defaultName, bytes }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "PDF Kaydet",
      defaultPath: defaultName || "output.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) return { canceled: true };

    await fs.writeFile(filePath, Buffer.from(bytes));
    return { canceled: false, filePath };
  });
}
