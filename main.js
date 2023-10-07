const {
    app, BrowserWindow, nativeImage,
    Tray, Menu, globalShortcut, screen
} = require('electron');
const path = require('path');
const {startDataClearJob, stopDataClearJob} = require('./src/service/dataClearJob.js');
const {startClipboardListener, stopClipboardListener} = require('./src/service/clipboardService.js');
const {registerKmListener, stopKmListener} = require('./src/service/uiohookService.js');
let mainWindow = null;
let boardWindows = {};
let tray = null;

// console.log(process.versions)

/**
 * 创建主窗口
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800, // 窗口宽度
        height: 600, // 窗口高度
        title: "Electron", // 窗口标题,如果由loadURL()加载的HTML文件中含有标签<title>，该属性可忽略
        icon: nativeImage.createFromPath('src/public/favicon.ico'), // "string" || nativeImage.createFromPath('src/image/icons/256x256.ico')从位于 path 的文件创建新的 NativeImage 实例
        show: false,
        webPreferences: { // 网页功能设置
            nodeIntegration: true, // 是否启用node集成 渲染进程的内容有访问node的能力
            webviewTag: true, // 是否使用<webview>标签 在一个独立的 frame 和进程里显示外部 web 内容
            webSecurity: false, // 禁用同源策略
            nodeIntegrationInSubFrames: true, // 是否允许在子页面(iframe)或子窗口(child window)中集成Node.js
            preload: path.join(__dirname, "./src/pages/Settings/preload.js")
        }
    });

    // 开发环境使用 http 协议 生产环境使用 file 协议
    if (process.env.NODE_ENV === 'dev') {
        mainWindow.loadURL('http://localhost:3000/');
    } else {
        mainWindow.loadFile(`file://${__dirname}/index.html`);
    }

    // 解决应用启动白屏问题
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // 当窗口关闭时发出。在你收到这个事件后，你应该删除对窗口的引用，并避免再使用它。
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });
}

// 创建剪贴板窗口
function createBoardWindow(main, display) {
    let bounds = display.bounds;
    let width = Math.floor(bounds.width);
    let height = Math.floor(bounds.height * 4 / 10);
    let workArea = display.workArea;
    let x = workArea.x;
    let y = workArea.y;
    console.log("创建窗口：", display.id, ",display:", display, ",width:", width, ",height:", height)
    let boardWindow = new BrowserWindow({
        width: width, // 窗口宽度
        height: height, // 窗口高度
        x: x,
        y: y,
        title: "zpaste", // 窗口标题,如果由loadURL()加载的HTML文件中含有标签<title>，该属性可忽略
        icon: nativeImage.createFromPath('src/public/favicon.ico'), // "string" || nativeImage.createFromPath('测试文本3src/image/icons/256x256.ico')从位于 path 的文件创建新的 NativeImage 实例
        show: false,
        frame: false,
        // focusable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        webPreferences: { // 网页功能设置
            nodeIntegration: true, // 是否启用node集成 渲染进程的内容有访问node的能力
            webviewTag: true, // 是否使用<webview>标签 在一个独立的 frame 和进程里显示外部 web 内容
            webSecurity: false, // 禁用同源策略
            nodeIntegrationInSubFrames: true, // 是否允许在子页面(iframe)或子窗口(child window)中集成Node.js
            preload: path.join(__dirname, 'src/pages/Board/preload.js')
        }
    });

    // 开发环境使用 http 协议 生产环境使用 file 协议
    if (process.env.NODE_ENV === 'dev') {
        boardWindow.loadURL(`http://localhost:3000/#/board?width=${width}&height=${height}`);
    } else {
        boardWindow.loadFile(`file://${__dirname}/index.html`, {hash: 'board', search: `mainBoard=${main}`});
    }

    // 解决屏幕无法铺满的问题
    boardWindow.setBounds({
        width: width,
        height: height,
        x: x,
        y: y,
    })

    let displayId = display.id;
    if (main === 'true') {
        boardWindows.mainBoardId = displayId;
        boardWindows.mainBoard = boardWindow;
    }

    boardWindows.boards = {[displayId]: boardWindow, ...boardWindows.boards};

}

// 创建托盘
function createTray() {
    // 托盘
    tray = new Tray(nativeImage.createFromPath('./public/tray.png'));
    tray.setToolTip('zpaste');

    tray.on('click', () => {
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
    startDataClearJob(boardWindows);
    startClipboardListener(boardWindows);
    registerKmListener(boardWindows);
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