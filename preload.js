// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Управление окном
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  },

  // Minecraft
  minecraft: {
    checkJava: () => ipcRenderer.invoke('check-java'),
    launch: (payload) => ipcRenderer.invoke('launch-minecraft', payload)
  },

  // Admin / server roles
  admin: {
    setServerAdmins: (payload) => ipcRenderer.invoke('set-server-admins', payload)
  },


  // Storage (Step 7) — прокси в main (userData JSON)
  storage: {
    get: (key, defaultValue = null) => ipcRenderer.invoke('storage:get:v1', { key, defaultValue }),
    set: (key, value) => ipcRenderer.invoke('storage:set:v1', { key, value }),
    dump: () => ipcRenderer.invoke('storage:dump:v1', {})
  },

  // События от main процесса
  on: {
    updateStatus: (cb) => ipcRenderer.on('update-status', (_, data) => cb(data)),
    downloadProgress: (cb) => ipcRenderer.on('download-progress', (_, data) => cb(data))
  }
});
