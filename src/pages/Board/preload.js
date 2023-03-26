const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onUpdateCounter: (callback) => ipcRenderer.on('add-clipboard', callback),
    selectClip: (clipData) => ipcRenderer.send('select-clip', clipData)
})