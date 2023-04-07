const { contextBridge, ipcRenderer } = require('electron')
const {CLIP_MESSAGE_CHANNEL} = require('../../common/backendConfigCons.js')


contextBridge.exposeInMainWorld('electronAPI', {
    addClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.ADD_CLIP, callback),
    initClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.INIT_CLIP, callback),
    selectClip: (clipData) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.SELECT_CLIP, clipData)
})