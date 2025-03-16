import React, { useState, useEffect } from 'react';
import './style.scss';

function Settings() {
    // 设置状态
    const [settings, setSettings] = useState({
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
    });
    
    const [systemInfo, setSystemInfo] = useState({
        version: '1.0.0',
        platform: 'darwin'
    });
    
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('');
    
    // 加载设置
    const loadSettings = async () => {
        try {
            setLoading(true);
            // 如果API可用，则从后端获取设置
            if (window.electronAPI) {
                const savedSettings = await window.electronAPI.getSettings();
                if (savedSettings) {
                    setSettings(savedSettings);
                }
                
                const sysInfo = await window.electronAPI.getSystemInfo();
                if (sysInfo) {
                    setSystemInfo(sysInfo);
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // 初始化加载设置
    useEffect(() => {
        loadSettings();
        
        // 注册导航监听
        if (window.electronAPI && window.electronAPI.onNavigateToSettings) {
            const removeListener = window.electronAPI.onNavigateToSettings(() => {
                // 当收到导航消息时重新加载设置
                loadSettings();
            });
            
            // 清理函数
            return () => {
                if (removeListener) {
                    removeListener();
                }
            };
        }
    }, []);
    
    // 处理设置变更
    const handleSettingChange = (section, key, value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: value
            }
        }));
        setSaveStatus('未保存');
    };
    
    // 保存设置
    const handleSaveSettings = async () => {
        try {
            setSaveStatus('保存中...');
            if (window.electronAPI) {
                await window.electronAPI.saveSettings(settings);
                setSaveStatus('已保存');
                setTimeout(() => setSaveStatus(''), 2000);
            }
        } catch (error) {
            console.error('保存设置失败:', error);
            setSaveStatus('保存失败');
        }
    };
    
    // 重置设置
    const handleResetSettings = async () => {
        try {
            if (window.electronAPI) {
                const defaultSettings = await window.electronAPI.resetSettings();
                setSettings(defaultSettings);
                setSaveStatus('已重置');
                setTimeout(() => setSaveStatus(''), 2000);
            }
        } catch (error) {
            console.error('重置设置失败:', error);
        }
    };
    
    // 打开外部链接
    const openExternalLink = (url) => {
        if (window.electronAPI) {
            window.electronAPI.openExternalLink(url);
        }
    };
    
    if (loading) {
        return (
            <div className="settings-wrapper">
                <div className="settings-loading">加载中...</div>
            </div>
        );
    }
    
    return (
        <div className="settings-wrapper">
            <div className="settings-header">
                <h1>设置</h1>
                <p>自定义 ZPaste 以满足您的需求</p>
            </div>
            
            <div className="settings-content">
                {/* 常规设置 */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <h2>常规</h2>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>开机启动</h3>
                                <p>登录系统时自动启动 ZPaste</p>
                            </div>
                            <div className="settings-item-control">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.general.startAtLogin}
                                        onChange={(e) => handleSettingChange('general', 'startAtLogin', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>在程序坞中显示</h3>
                                <p>在程序坞/任务栏中显示 ZPaste 图标</p>
                            </div>
                            <div className="settings-item-control">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.general.showInDock}
                                        onChange={(e) => handleSettingChange('general', 'showInDock', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>剪贴板检查间隔</h3>
                                <p>检查剪贴板变化的时间间隔（毫秒）</p>
                            </div>
                            <div className="settings-item-control">
                                <div className="select-wrapper">
                                    <select 
                                        value={settings.general.clipboardCheckInterval}
                                        onChange={(e) => handleSettingChange('general', 'clipboardCheckInterval', Number(e.target.value))}
                                    >
                                        <option value={250}>250 ms（更快）</option>
                                        <option value={500}>500 ms（推荐）</option>
                                        <option value={1000}>1000 ms（省电）</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>最大历史记录数</h3>
                                <p>保存的最大剪贴板历史记录数量</p>
                            </div>
                            <div className="settings-item-control">
                                <div className="select-wrapper">
                                    <select 
                                        value={settings.general.maxHistoryItems}
                                        onChange={(e) => handleSettingChange('general', 'maxHistoryItems', Number(e.target.value))}
                                    >
                                        <option value={50}>50 项</option>
                                        <option value={100}>100 项</option>
                                        <option value={200}>200 项</option>
                                        <option value={500}>500 项</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 外观设置 */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <h2>外观</h2>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>主题</h3>
                                <p>选择应用的显示主题</p>
                            </div>
                            <div className="settings-item-control">
                                <div className="select-wrapper">
                                    <select 
                                        value={settings.appearance.theme}
                                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                                    >
                                        <option value="system">跟随系统</option>
                                        <option value="light">浅色</option>
                                        <option value="dark">深色</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>透明效果</h3>
                                <p>启用毛玻璃透明效果</p>
                            </div>
                            <div className="settings-item-control">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.appearance.transparency}
                                        onChange={(e) => handleSettingChange('appearance', 'transparency', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 快捷键设置 */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <h2>快捷键</h2>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>显示剪贴板</h3>
                                <p>快速打开剪贴板历史记录</p>
                            </div>
                            <div className="settings-item-control">
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={settings.shortcuts.showClipboard}
                                    onChange={(e) => handleSettingChange('shortcuts', 'showClipboard', e.target.value)}
                                    placeholder="例如: Alt+Space"
                                />
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>无格式粘贴</h3>
                                <p>粘贴纯文本，去除格式</p>
                            </div>
                            <div className="settings-item-control">
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={settings.shortcuts.pasteWithoutFormatting}
                                    onChange={(e) => handleSettingChange('shortcuts', 'pasteWithoutFormatting', e.target.value)}
                                    placeholder="例如: Shift+Command+V"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 高级设置 */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <h2>高级</h2>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>保存图片历史</h3>
                                <p>在历史记录中保存复制的图片</p>
                            </div>
                            <div className="settings-item-control">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.advanced.storeImagesInHistory}
                                        onChange={(e) => handleSettingChange('advanced', 'storeImagesInHistory', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>保存格式化文本</h3>
                                <p>保存带格式的富文本（HTML）</p>
                            </div>
                            <div className="settings-item-control">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.advanced.storeFormattedText}
                                        onChange={(e) => handleSettingChange('advanced', 'storeFormattedText', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>自动清理历史记录</h3>
                                <p>自动删除超过指定天数的历史记录</p>
                            </div>
                            <div className="settings-item-control">
                                <div className="select-wrapper">
                                    <select 
                                        value={settings.advanced.clearHistoryAfterDays}
                                        onChange={(e) => handleSettingChange('advanced', 'clearHistoryAfterDays', Number(e.target.value))}
                                    >
                                        <option value={7}>7 天</option>
                                        <option value={30}>30 天</option>
                                        <option value={90}>90 天</option>
                                        <option value={0}>永不</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>启用日志记录</h3>
                                <p>记录应用日志以便排查问题</p>
                            </div>
                            <div className="settings-item-control">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.advanced.enableLogging}
                                        onChange={(e) => handleSettingChange('advanced', 'enableLogging', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 关于 */}
                <div className="settings-section">
                    <div className="settings-section-header">
                        <h2>关于</h2>
                    </div>
                    <div className="settings-section-content">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>版本</h3>
                                <p>{systemInfo.version}</p>
                            </div>
                            <div className="settings-item-control">
                                <button 
                                    className="button button-secondary"
                                    onClick={() => openExternalLink('https://github.com/yourusername/zpaste/releases')}
                                >
                                    检查更新
                                </button>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>反馈问题</h3>
                                <p>报告问题或提出建议</p>
                            </div>
                            <div className="settings-item-control">
                                <button 
                                    className="button button-secondary"
                                    onClick={() => openExternalLink('https://github.com/yourusername/zpaste/issues')}
                                >
                                    提交反馈
                                </button>
                            </div>
                        </div>
                        
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <h3>系统信息</h3>
                                <p>{systemInfo.osName} {systemInfo.osVersion} ({systemInfo.arch})</p>
                            </div>
                            <div className="settings-item-control">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="settings-footer">
                <div className="save-status">{saveStatus}</div>
                <button 
                    className="button button-secondary"
                    onClick={handleResetSettings}
                >
                    重置
                </button>
                <button 
                    className="button button-primary"
                    onClick={handleSaveSettings}
                >
                    保存
                </button>
            </div>
        </div>
    );
}

export default Settings;