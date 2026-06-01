/**
 * 国际化模块单元测试
 */

const {t, setLocale, getLocale, messages} = require('../index');

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

describe('国际化模块测试', () => {
    
    beforeEach(() => {
        // 每个测试前重置为中文
        setLocale('zh-CN');
        localStorageMock.clear();
    });
    
    describe('t() 翻译函数', () => {
        test('应该返回正确的中文翻译', () => {
            setLocale('zh-CN');
            expect(t('app.name')).toBe('zpaste');
            expect(t('tray.openPanel')).toBe('打开面板');
            expect(t('clipboard.text')).toBe('文本');
        });
        
        test('应该返回正确的英文翻译', () => {
            setLocale('en');
            expect(t('app.name')).toBe('zpaste');
            expect(t('tray.openPanel')).toBe('Open Panel');
            expect(t('clipboard.text')).toBe('Text');
        });
        
        test('应该支持嵌套键', () => {
            expect(t('settings.general')).toBe('通用');
            expect(t('error.clipboardRead')).toBe('读取剪贴板失败');
        });
        
        test('键不存在时应该返回键名', () => {
            expect(t('nonexistent.key')).toBe('nonexistent.key');
            expect(t('app.nonexistent')).toBe('app.nonexistent');
        });
        
        test('应该支持参数替换', () => {
            setLocale('zh-CN');
            expect(t('time.minutesAgo', {n: 5})).toBe('5分钟前');
            expect(t('time.hoursAgo', {n: 2})).toBe('2小时前');
            
            setLocale('en');
            expect(t('time.minutesAgo', {n: 5})).toBe('5 minutes ago');
            expect(t('time.hoursAgo', {n: 2})).toBe('2 hours ago');
        });
        
        test('应该支持多个参数', () => {
            // 假设有这样的翻译：'{name} copied {count} items'
            // 这里测试基础参数替换功能
            const testKey = 'test.key';
            const testMessages = {'zh-CN': {test: {key: '{name}复制了{count}个项目'}}};
            
            // 临时添加测试消息
            messages['zh-CN'].test = {key: '{name}复制了{count}个项目'};
            
            expect(t('test.key', {name: '用户', count: 5})).toBe('用户复制了5个项目');
            
            // 清理
            delete messages['zh-CN'].test;
        });
    });
    
    describe('setLocale() 设置语言', () => {
        test('应该正确设置语言', () => {
            setLocale('en');
            expect(getLocale()).toBe('en');
            
            setLocale('zh-CN');
            expect(getLocale()).toBe('zh-CN');
        });
        
        test('无效的语言代码应该被忽略', () => {
            setLocale('zh-CN');
            setLocale('invalid');
            expect(getLocale()).toBe('zh-CN');
        });
        
        test('应该保存到localStorage', () => {
            setLocale('en');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('zpaste-locale', 'en');
        });
    });
    
    describe('getLocale() 获取语言', () => {
        test('应该返回当前语言', () => {
            expect(getLocale()).toBe('zh-CN');
            
            setLocale('en');
            expect(getLocale()).toBe('en');
        });
    });
    
    describe('messages 语言包', () => {
        test('应该包含中文和英文', () => {
            expect(messages).toHaveProperty('zh-CN');
            expect(messages).toHaveProperty('en');
        });
        
        test('两种语言应该有相同的键结构', () => {
            const getKeys = (obj, prefix = '') => {
                let keys = [];
                for (const key in obj) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        keys = keys.concat(getKeys(obj[key], fullKey));
                    } else {
                        keys.push(fullKey);
                    }
                }
                return keys;
            };
            
            const zhKeys = getKeys(messages['zh-CN']).sort();
            const enKeys = getKeys(messages['en']).sort();
            
            expect(zhKeys).toEqual(enKeys);
        });
    });
});
