import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron';
import { join, dirname } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

let win: BrowserWindow | null = null;
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1200, height: 800, show: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
    },
  });

  // ponytail: dev 加载 dev server URL,prod 加载打包文件
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  ipcMain.handle('yi:save-qipu', async (_e, data: unknown) => {
    const res = await dialog.showSaveDialog(win!, {
      defaultPath: 'task.yi.json',
      filters: [{ name: 'Yi 棋谱', extensions: ['yi.json'] }],
    });
    if (res.canceled || !res.filePath) return null;
    await mkdir(dirname(res.filePath), { recursive: true });
    await writeFile(res.filePath, JSON.stringify(data, null, 2), 'utf8');
    return res.filePath;
  });

  ipcMain.handle('yi:load-qipu', async () => {
    const res = await dialog.showOpenDialog(win!, {
      filters: [{ name: 'Yi 棋谱', extensions: ['yi.json'] }],
      properties: ['openFile'],
    });
    if (res.canceled || !res.filePaths.length) return null;
    return JSON.parse(await readFile(res.filePaths[0], 'utf8'));
  });

  globalShortcut.register('CommandOrControl+Shift+Y', () => {
    win?.webContents.send('yi:toggle-bushi');
  });
});
app.on('will-quit', () => globalShortcut.unregisterAll());
