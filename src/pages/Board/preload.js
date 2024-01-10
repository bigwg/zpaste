const { contextBridge, ipcRenderer } = require('electron')
const {CLIP_MESSAGE_CHANNEL} = require('../../common/backendConfigCons.js')

/**
 * 暴露 api 到页面上下文
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 后端消息监听
    updateBoard: (callback) => ipcRenderer.on(CLIP_MESSAGE_CHANNEL.UPDATE_BOARD, callback),
    // 通知后端消息
    selectClip: (clipId) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.SELECT_CLIP, clipId),
    pasteClip: (clipData) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.PASTE_CLIP, clipData),
    pageQueryClip: (queryParam) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.PAGE_QUERY_CLIP, queryParam),
    initBoard: (boardKey) => ipcRenderer.send(CLIP_MESSAGE_CHANNEL.INIT_BOARD, boardKey),
})