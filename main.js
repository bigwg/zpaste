const {
    app, BrowserWindow, nativeImage,
    Tray, Menu, globalShortcut, screen, systemPreferences
} = require('electron');

const {startDataClearJob, stopDataClearJob} = require('./src/service/dataClearJob');
const {startClipboardListener, stopClipboardListener, recordActiveWindow, clearActiveWindow} = require('./src/service/clipboardService');
const {registerKmListener, stopKmListener} = require('./src/service/uiohookService');
const {createMainWindow, createBoardWindow, getMainWindow, getBoardWindows} = require('./src/service/windowService');
const {startSettingsService} = require('./src/service/settingsService');

let tray = null;

// console.log(process.versions)

// 创建托盘
function createTray() {
    // 托盘
    tray = new Tray(nativeImage.createFromPath('./public/tray.png'));
    tray.setToolTip('zpaste');

    tray.on('click', () => {
        let mainWindow = getMainWindow();
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        } else {
            createMainWindow();
        }
    });

    const menuItems = [
        {
            label: "打开面板", type: "normal", click() {
                let boardWindows = getBoardWindows();
                if (boardWindows && boardWindows.boards) {
                    let cursorScreenPoint = screen.getCursorScreenPoint();
                    let displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
                    let boards = boardWindows.boards;
                    let currentBoardWindow = boards[displayNearestPoint.id];
                    console.log("尝试显示面板，显示器ID:", displayNearestPoint.id, "窗口存在:", !!currentBoardWindow);
                    if (currentBoardWindow) {
                        // 显示之前记录当前活跃窗口
                        recordActiveWindow();
                        currentBoardWindow.show();
                        for (const board in boards) {
                            if (board != displayNearestPoint.id && boards[board]) {
                                boards[board].hide();
                            }
                        }
                    } else {
                        console.error("找不到对应显示器的Board窗口:", displayNearestPoint.id);
                    }
                }
            }
        }, {
            label: "设置", type: "normal", click() {
                let mainWindow = getMainWindow();
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    mainWindow.webContents.send('navigate-to-settings');
                } else {
                    createMainWindow();
                    // 等待窗口创建完成后再发送消息
                    setTimeout(() => {
                        let win = getMainWindow();
                        if (win) {
                            win.webContents.send('navigate-to-settings');
                        }
                    }, 500);
                }
            }
        }, {
            label: "退出", type: "normal", click() {
                app.exit();
            }
        }
    ]

    let menu = Menu.buildFromTemplate(menuItems);

    tray.on("right-click", () => {
        tray.popUpContextMenu(menu);
    })
}

// 检查macOS权限
function checkMacOSPermissions() {
    if (process.platform === 'darwin') {
        const trusted = systemPreferences.isTrustedAccessibilityClient(false);
        console.log('macOS辅助功能权限状态:', trusted);
        if (!trusted) {
            console.log('请在系统偏好设置 > 安全性与隐私 > 隐私 > 辅助功能中添加此应用');
            console.log('没有辅助功能权限，双击粘贴功能将无法正常工作');
            
            // 尝试请求权限
            const requestResult = systemPreferences.isTrustedAccessibilityClient(true);
            console.log('权限请求结果:', requestResult);
            
            // 显示用户友好的提示
            const { dialog } = require('electron');
            dialog.showMessageBox({
                type: 'warning',
                title: 'zpaste 需要辅助功能权限',
                message: '为了正常使用双击粘贴功能，请授予 zpaste 辅助功能权限',
                detail: '请前往：系统偏好设置 > 安全性与隐私 > 隐私 > 辅助功能，然后添加 zpaste 应用',
                buttons: ['好的', '稍后设置']
            });
        }
        return trusted;
    }
    return true;
}

// 注册默认全局快捷键
function registerDefaultGlobalShortcut() {
    // 先检查权限
    const hasPermission = checkMacOSPermissions();
    if (!hasPermission) {
        console.log('权限不足，快捷键可能无法正常工作');
    }
    // 注册快捷键
    const ret = globalShortcut.register('Alt+Space', () => {
        let boardWindows = getBoardWindows();
        if (boardWindows && boardWindows.boards) {
            let cursorScreenPoint = screen.getCursorScreenPoint();
            let displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
            let boards = boardWindows.boards;
            let currentBoardWindow = boards[displayNearestPoint.id];
            console.log("快捷键触发，显示器ID:", displayNearestPoint.id, "窗口存在:", !!currentBoardWindow);
            if (currentBoardWindow) {
                if (currentBoardWindow.isVisible()) {
                    currentBoardWindow.hide();
                    clearActiveWindow(); // 隐藏时清除记录
                } else {
                    // 显示之前记录当前活跃窗口
                    recordActiveWindow();
                    currentBoardWindow.show();
                }
                for (const board in boards) {
                    if (board != displayNearestPoint.id && boards[board]) {
                        boards[board].hide();
                    }
                }
            } else {
                console.error("找不到对应显示器的Board窗口:", displayNearestPoint.id);
            }
        }
    });
    
    if (ret) {
        console.log('全局快捷键 Alt+Space 注册成功');
    } else {
        console.error('全局快捷键 Alt+Space 注册失败');
    }
    
    // 检查快捷键是否已注册
    console.log('Alt+Space 是否已注册:', globalShortcut.isRegistered('Alt+Space'));
    
    // 尝试注册一个备用快捷键作为测试
    const ret2 = globalShortcut.register('CommandOrControl+Shift+Z', () => {
        console.log('备用快捷键 CommandOrControl+Shift+Z 被触发');
        let boardWindows = getBoardWindows();
        if (boardWindows && boardWindows.boards) {
            let cursorScreenPoint = screen.getCursorScreenPoint();
            let displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
            let boards = boardWindows.boards;
            let currentBoardWindow = boards[displayNearestPoint.id];
            console.log("备用快捷键触发，显示器ID:", displayNearestPoint.id, "窗口存在:", !!currentBoardWindow);
            if (currentBoardWindow) {
                if (currentBoardWindow.isVisible()) {
                    currentBoardWindow.hide();
                    clearActiveWindow(); // 隐藏时清除记录
                } else {
                    // 显示之前记录当前活跃窗口
                    recordActiveWindow();
                    currentBoardWindow.show();
                }
                for (const board in boards) {
                    if (board != displayNearestPoint.id && boards[board]) {
                        boards[board].hide();
                    }
                }
            } else {
                console.error("找不到对应显示器的Board窗口:", displayNearestPoint.id);
            }
        }
    });
    
    if (ret2) {
        console.log('备用快捷键 CommandOrControl+Shift+Z 注册成功');
    } else {
        console.error('备用快捷键 CommandOrControl+Shift+Z 注册失败');
    }
}

app.on('ready', () => {
    let primaryDisplay = screen.getPrimaryDisplay();
    let allDisplays = screen.getAllDisplays();
    console.log("屏幕信息：", JSON.stringify(allDisplays));
    console.log("当前平台:", process.platform);

    // 首先检查macOS权限
    const hasPermission = checkMacOSPermissions();
    if (process.platform === 'darwin' && !hasPermission) {
        console.log("macOS权限检查失败，某些功能可能无法正常工作");
    }

    createTray();
    createMainWindow();
    for (const displayKey in allDisplays) {
        let display = allDisplays[displayKey]
        if (displayKey === "0") {
            createBoardWindow("true", display);
        } else {
            createBoardWindow("false", display);
        }
    }
    
    // 延迟注册快捷键，确保窗口都创建完成
    setTimeout(() => {
        registerDefaultGlobalShortcut();
    }, 1000);
    startDataClearJob();
    startClipboardListener();
    registerKmListener();
    startSettingsService();
    // if(Object.is(process.platform, "darwin")){
    //     console.log('这是mac系统');
    // }
    // if(Object.is(process.platform, "win32")){
    //     console.log('这是windows系统');
    // }
    // if(Object.is(process.platform, "linux")){
    //     console.log('这是linux系统');
    // }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
});

app.on('quit', () => {
    stopKmListener();
    stopClipboardListener();
    stopDataClearJob();
});