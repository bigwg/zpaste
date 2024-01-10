const {
    app, BrowserWindow, nativeImage,
    Tray, Menu, globalShortcut, screen
} = require('electron');

const {startDataClearJob, stopDataClearJob} = require('./src/service/dataClearJob');
const {startClipboardListener, stopClipboardListener} = require('./src/service/clipboardService');
const {registerKmListener, stopKmListener} = require('./src/service/uiohookService');
const {createMainWindow, createBoardWindow, getMainWindow, getBoardWindows} = require('./src/service/boardWindowService');

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
                if (boardWindows) {
                    let cursorScreenPoint = screen.getCursorScreenPoint();
                    let displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
                    let boards = boardWindows.boards;
                    let currentBoardWindow = boards[displayNearestPoint.id]
                    currentBoardWindow.show();
                    for (const board in boards) {
                        if (board !== displayNearestPoint.id) {
                            boards[board].hide();
                        }
                    }
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

// 注册默认全局快捷键
function registerDefaultGlobalShortcut() {
    globalShortcut.register('CommandOrControl+Shift+V', () => {
        let cursorScreenPoint = screen.getCursorScreenPoint();
        let displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
        let displayId = displayNearestPoint.id;
        let boardWindows = getBoardWindows();
        let boards = boardWindows.boards;
        for (let boardId in boards) {
            let currentBoard = boards[boardId];
            if (Object.is(boardId, JSON.stringify(displayId))) {
                if (currentBoard.isVisible()) {
                    currentBoard.hide();
                } else {
                    currentBoard.show();
                }
            } else {
                if (currentBoard.isVisible()) {
                    currentBoard.hide();
                }
            }
        }
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