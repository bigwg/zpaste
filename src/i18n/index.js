/**
 * 国际化配置
 * 支持中文和英文
 */

// 语言包
const messages = {
    'zh-CN': {
        // 通用
        app: {
            name: 'zpaste',
            description: '剪贴板管理器'
        },
        
        // 托盘菜单
        tray: {
            openPanel: '打开面板',
            settings: '设置',
            quit: '退出'
        },
        
        // 剪贴板
        clipboard: {
            text: '文本',
            htmlText: '富文本',
            image: '图片',
            empty: '暂无剪贴板内容',
            loading: '加载中...',
            noMore: '没有更多了...',
            loadMore: '开始加载下一页...'
        },
        
        // 提示信息
        hint: {
            selectClip: '点击选择，双击粘贴',
            arrowKeys: '使用←→键选择，回车粘贴',
            escToClose: '按ESC关闭'
        },
        
        // 时间
        time: {
            justNow: '刚刚',
            minutesAgo: '{n}分钟前',
            hoursAgo: '{n}小时前',
            today: '今天',
            yesterday: '昨天'
        },
        
        // 设置页面
        settings: {
            title: '设置',
            general: '通用',
            shortcut: '快捷键',
            about: '关于',
            language: '语言',
            chinese: '中文',
            english: '英文',
            autoStart: '开机自启动',
            hotkey: '全局快捷键',
            save: '保存',
            cancel: '取消'
        },
        
        // 错误信息
        error: {
            clipboardRead: '读取剪贴板失败',
            clipboardWrite: '写入剪贴板失败',
            windowCreate: '创建窗口失败'
        }
    },
    
    'en': {
        // General
        app: {
            name: 'zpaste',
            description: 'Clipboard Manager'
        },
        
        // Tray menu
        tray: {
            openPanel: 'Open Panel',
            settings: 'Settings',
            quit: 'Quit'
        },
        
        // Clipboard
        clipboard: {
            text: 'Text',
            htmlText: 'Rich Text',
            image: 'Image',
            empty: 'No clipboard content',
            loading: 'Loading...',
            noMore: 'No more items...',
            loadMore: 'Loading next page...'
        },
        
        // Hints
        hint: {
            selectClip: 'Click to select, double-click to paste',
            arrowKeys: 'Use ←→ to select, Enter to paste',
            escToClose: 'Press ESC to close'
        },
        
        // Time
        time: {
            justNow: 'Just now',
            minutesAgo: '{n} minutes ago',
            hoursAgo: '{n} hours ago',
            today: 'Today',
            yesterday: 'Yesterday'
        },
        
        // Settings page
        settings: {
            title: 'Settings',
            general: 'General',
            shortcut: 'Shortcuts',
            about: 'About',
            language: 'Language',
            chinese: 'Chinese',
            english: 'English',
            autoStart: 'Auto Start',
            hotkey: 'Global Hotkey',
            save: 'Save',
            cancel: 'Cancel'
        },
        
        // Error messages
        error: {
            clipboardRead: 'Failed to read clipboard',
            clipboardWrite: 'Failed to write clipboard',
            windowCreate: 'Failed to create window'
        }
    }
};

// 默认语言
let currentLocale = 'zh-CN';

/**
 * 设置当前语言
 * @param {string} locale - 语言代码 ('zh-CN' 或 'en')
 */
function setLocale(locale) {
    if (messages[locale]) {
        currentLocale = locale;
        // 保存到本地存储
        try {
            localStorage.setItem('zpaste-locale', locale);
        } catch (e) {
            console.log('保存语言设置失败:', e);
        }
    }
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getLocale() {
    return currentLocale;
}

/**
 * 初始化语言设置
 * 从本地存储读取，如果没有则使用系统语言
 */
function initLocale() {
    try {
        const savedLocale = localStorage.getItem('zpaste-locale');
        if (savedLocale && messages[savedLocale]) {
            currentLocale = savedLocale;
            return;
        }
    } catch (e) {
        console.log('读取语言设置失败:', e);
    }
    
    // 检测系统语言
    const systemLang = navigator.language || navigator.userLanguage;
    if (systemLang.startsWith('zh')) {
        currentLocale = 'zh-CN';
    } else {
        currentLocale = 'en';
    }
}

/**
 * 获取翻译文本
 * @param {string} key - 键名，支持点号分隔 (e.g., 'tray.openPanel')
 * @param {Object} params - 替换参数 (e.g., {n: 5})
 * @returns {string} 翻译后的文本
 */
function t(key, params = {}) {
    const keys = key.split('.');
    let value = messages[currentLocale];
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // 键不存在时返回键名
        }
    }
    
    if (typeof value !== 'string') {
        return key;
    }
    
    // 替换参数
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    }
    
    return result;
}

/**
 * React Hook: 使用翻译
 * 在组件中使用: const { t, locale, setLocale } = useTranslation();
 */
function useTranslation() {
    // 这里简化处理，实际应该使用React的useState和useEffect
    return {
        t,
        locale: currentLocale,
        setLocale,
        getLocale
    };
}

module.exports = {
    setLocale,
    getLocale,
    initLocale,
    t,
    useTranslation,
    messages
};
