import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('yi', {
  onToggleBushu: (cb: () => void) => ipcRenderer.on('yi:toggle-bushi', cb),
  saveQipu: (data: unknown) => ipcRenderer.invoke('yi:save-qipu', data),
  loadQipu: () => ipcRenderer.invoke('yi:load-qipu'),
});
