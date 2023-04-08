const { contextBridge, ipcRenderer } = require('electron')
const {CLIP_MESSAGE_CHANNEL} = require('../../common/backendConfigCons.js')

/**
 * 暴露 api 到页面上下文
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 后端消息监听
    addClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.ADD_CLIP, callback),
    initClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.INIT_CLIP, callback),
    removeClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.REMOVE_CLIP, callback),
    // 通知后端消息
    selectClip: (clipData) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.SELECT_CLIP, clipData),
    pageClip: (pageData) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.PAGE_CLIP, pageData)
})