const {
    app, BrowserWindow, nativeImage,
    Tray, Menu, globalShortcut, screen
} = require('electron');

const {startDataClearJob, stopDataClearJob} = require('./src/service/dataClearJob');
const {startClipboardListener, stopClipboardListener} = require('./src/service/clipboardService');
const {registerKmListener, stopKmListener} = require('./src/service/uiohookService');
const {createMainWindow, createBoardWindow, getMainWindow, getBoardWindows, hideAllBoardWindows} = require('./src/service/boardWindowService');

let tray = null;

// console.log(process.versions)

/**
 * 获取焦点窗口所在的屏幕ID
 * 如果没有焦点窗口，返回鼠标所在的屏幕ID
 * @returns {number} displayId
 */
function getTargetDisplayId() {
    // 尝试获取当前焦点窗口
    const focusedWindow = BrowserWindow.getFocusedWindow();
    
    if (focusedWindow && !focusedWindow.isDestroyed()) {
        // 获取焦点窗口所在的屏幕
        const windowBounds = focusedWindow.getBounds();
        const windowCenter = {
            x: windowBounds.x + windowBounds.width / 2,
            y: windowBounds.y + windowBounds.height / 2
        };
        const display = screen.getDisplayNearestPoint(windowCenter);
        console.log("使用焦点窗口所在屏幕:", display.id);
        return display.id;
    }
    
    // 如果没有焦点窗口，使用鼠标所在的屏幕
    const cursorScreenPoint = screen.getCursorScreenPoint();
    const displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
    console.log("使用鼠标所在屏幕:", displayNearestPoint.id);
    return displayNearestPoint.id;
}

/**
 * 显示指定屏幕的board窗口，隐藏其他
 * @param {number} targetDisplayId - 目标屏幕ID
 */
function showBoardWindow(targetDisplayId) {
    let boardWindows = getBoardWindows();
    if (!boardWindows || !boardWindows.boards) return;
    
    let boards = boardWindows.boards;
    for (let boardId in boards) {
        let currentBoard = boards[boardId];
        if (boardId === targetDisplayId.toString() || boardId === targetDisplayId) {
            if (currentBoard.isVisible()) {
                currentBoard.hide();
            } else {
                currentBoard.show();
                currentBoard.focus();
            }
        } else {
            if (currentBoard.isVisible()) {
                currentBoard.hide();
            }
        }
    }
}

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
                const targetDisplayId = getTargetDisplayId();
                showBoardWindow(targetDisplayId);
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

// 注册默认全局快捷键
function registerDefaultGlobalShortcut() {
    globalShortcut.register('CommandOrControl+Shift+V', () => {
        const targetDisplayId = getTargetDisplayId();
        showBoardWindow(targetDisplayId);
    });
}

app.on('ready', () => {
    let primaryDisplay = screen.getPrimaryDisplay();
    let allDisplays = screen.getAllDisplays();
    console.log("屏幕信息：", JSON.stringify(allDisplays));

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
    registerDefaultGlobalShortcut();
    startDataClearJob();
    startClipboardListener();
    registerKmListener();
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
