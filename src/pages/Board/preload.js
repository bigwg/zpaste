const { contextBridge, ipcRenderer } = require('electron')
const {CLIP_MESSAGE_CHANNEL} = require('../../common/backendConfigCons.js')

/**
 * 暴露 api 到页面上下文
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 后端消息监听
    addClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.ADD_CLIP, callback),
    appendClips: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.APPEND_CLIPS, callback),
    removeClip: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.REMOVE_CLIP, callback),
    // 通知后端消息
    selectClip: (clipData) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.SELECT_CLIP, clipData),
    pageQueryClip: (queryParam) => ipcRenderer.invoke(CLIP_MESSAGE_CHANNEL.PAGE_QUERY_CLIP, queryParam)
})