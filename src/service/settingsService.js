const { ipcMain, shell, app } = require('electron');
const { getConfig, updateConfig } = require('../data/configData');
const { SETTINGS_MESSAGE_CHANNEL } = require('../common/backendConfigCons');
const os = require('os');

// 设置键名
const SETTINGS_KEY = 'app_settings';

// 默认设置
const DEFAULT_SETTINGS = {
    general: {
        startAtLogin: true,
        showInDock: true,
        clipboardCheckInterval: 500,
        maxHistoryItems: 100
    },
    appearance: {
        theme: 'system', // system, light, dark
        transparency: true
    },
    shortcuts: {
        showClipboard: 'Alt+Space',
        pasteWithoutFormatting: 'Shift+Command+V'
    },
    advanced: {
        storeImagesInHistory: true,
        storeFormattedText: true,
        clearHistoryAfterDays: 30,
        enableLogging: false
    }
};

// 缓存的设置
let cachedSettings = null;

/**
 * 获取设置
 * @returns {Promise<*>} 设置对象
 */
async function getSettings() {
    if (cachedSettings) {
        return cachedSettings;
    }

    try {
        const settingsDoc = await getConfig(SETTINGS_KEY);
        if (settingsDoc && settingsDoc.value) {
            cachedSettings = settingsDoc.value;
            return cachedSettings;
        } else {
            // 如果没有找到设置，则使用默认设置
            await saveSettings(DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }
    } catch (error) {
        console.error('获取设置失败:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * 保存设置
 * @param settings 设置对象
 * @returns {Promise<*>} 保存后的设置对象
 */
async function saveSettings(settings) {
    try {
        await updateConfig(SETTINGS_KEY, settings);
        cachedSettings = settings;
        
        // 应用设置
        applySettings(settings);
        
        return settings;
    } catch (error) {
        console.error('保存设置失败:', error);
        throw error;
    }
}

/**
 * 重置设置
 * @returns {Promise<*>} 重置后的默认设置
 */
async function resetSettings() {
    try {
        await saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('重置设置失败:', error);
        throw error;
    }
}

/**
 * 应用设置到应用程序
 * @param settings 设置对象
 */
function applySettings(settings) {
    // 应用剪贴板检查间隔
    if (settings.general && settings.general.clipboardCheckInterval) {
        global.clipboardCheckInterval = settings.general.clipboardCheckInterval;
    }
    
    // 应用最大历史记录数
    if (settings.general && settings.general.maxHistoryItems) {
        global.maxHistoryItems = settings.general.maxHistoryItems;
    }
    
    // 应用主题
    if (settings.appearance && settings.appearance.theme) {
        // 这里可以添加主题切换的逻辑
    }
    
    // 应用透明效果
    if (settings.appearance && settings.appearance.transparency !== undefined) {
        // 这里可以添加透明效果的逻辑
    }
    
    // 应用快捷键
    if (settings.shortcuts) {
        // 这里可以添加快捷键注册的逻辑
    }
}

/**
 * 获取系统信息
 * @returns {Promise<{version: string, platform: string}>} 系统信息
 */
async function getSystemInfo() {
    return {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        osVersion: os.release(),
        osName: getOSName()
    };
}

/**
 * 获取操作系统名称
 * @returns {string} 操作系统名称
 */
function getOSName() {
    switch (process.platform) {
        case 'win32':
            return 'Windows';
        case 'darwin':
            return 'macOS';
        case 'linux':
            return 'Linux';
        default:
            return process.platform;
    }
}

/**
 * 注册设置相关的IPC处理程序
 */
function registerSettingsHandlers() {
    // 获取设置
    ipcMain.handle(SETTINGS_MESSAGE_CHANNEL.GET_SETTINGS, async () => {
        return await getSettings();
    });
    
    // 保存设置
    ipcMain.handle(SETTINGS_MESSAGE_CHANNEL.SAVE_SETTINGS, async (event, settings) => {
        return await saveSettings(settings);
    });
    
    // 重置设置
    ipcMain.handle(SETTINGS_MESSAGE_CHANNEL.RESET_SETTINGS, async () => {
        return await resetSettings();
    });
    
    // 获取系统信息
    ipcMain.handle(SETTINGS_MESSAGE_CHANNEL.GET_SYSTEM_INFO, async () => {
        return await getSystemInfo();
    });
    
    // 打开外部链接
    ipcMain.on(SETTINGS_MESSAGE_CHANNEL.OPEN_EXTERNAL_LINK, (event, url) => {
        shell.openExternal(url).catch(err => {
            console.error('打开外部链接失败:', err);
        });
    });
}

/**
 * 启动设置服务
 */
function startSettingsService() {
    registerSettingsHandlers();
    
    // 初始化加载设置
    getSettings().then(settings => {
        applySettings(settings);
    }).catch(error => {
        console.error('初始化设置失败:', error);
    });
}

module.exports = {
    startSettingsService,
    getSettings,
    saveSettings,
    resetSettings,
    getSystemInfo
}; 