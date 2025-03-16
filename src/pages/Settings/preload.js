const { contextBridge, ipcRenderer } = require('electron')
const { SETTINGS_MESSAGE_CHANNEL } = require('../../common/backendConfigCons')

contextBridge.exposeInMainWorld('electronAPI', {
    setTitle: (title) => ipcRenderer.send('set-title', title),
    // 获取设置
    getSettings: () => ipcRenderer.invoke(SETTINGS_MESSAGE_CHANNEL.GET_SETTINGS),
    // 保存设置
    saveSettings: (settings) => ipcRenderer.invoke(SETTINGS_MESSAGE_CHANNEL.SAVE_SETTINGS, settings),
    // 重置设置
    resetSettings: () => ipcRenderer.invoke(SETTINGS_MESSAGE_CHANNEL.RESET_SETTINGS),
    // 获取系统信息
    getSystemInfo: () => ipcRenderer.invoke(SETTINGS_MESSAGE_CHANNEL.GET_SYSTEM_INFO),
    // 打开外部链接
    openExternalLink: (url) => ipcRenderer.send(SETTINGS_MESSAGE_CHANNEL.OPEN_EXTERNAL_LINK, url),
    // 导航监听
    onNavigateToSettings: (callback) => ipcRenderer.on('navigate-to-settings', callback)
})