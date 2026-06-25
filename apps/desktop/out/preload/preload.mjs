import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("yi", {
  onToggleBushu: (cb) => ipcRenderer.on("yi:toggle-bushi", cb),
  saveQipu: (data) => ipcRenderer.invoke("yi:save-qipu", data),
  loadQipu: () => ipcRenderer.invoke("yi:load-qipu")
});
