const {
    app, BrowserWindow, nativeImage,
    Tray, Menu, globalShortcut, ipcMain
} = require('electron');
const path = require('path');
const startDataClearJob = require('./src/service/dataClearJob.js');
const {
    startClipboardListener, stopClipboardListener, registerMsgConsumer
} = require('./src/service/clipboardService.js');
const {uIOhook, UiohookKey} = require('uiohook-napi');
const { screen } = require('electron');

let mainWindow = null;
let boardWindow = null;
let tray = null;

// console.log(process.versions)

// 创建主窗口（设置窗口）
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
            preload:path.join(__dirname,"./src/pages/Settings/preload.js")
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
function createBoardWindow(main) {
    boardWindow = new BrowserWindow({
        width: 1600, // 窗口宽度
        height: 400, // 窗口高度
        x: 0,
        y: 0,
        title: "zpaste", // 窗口标题,如果由loadURL()加载的HTML文件中含有标签<title>，该属性可忽略
        icon: nativeImage.createFromPath('src/public/favicon.ico'), // "string" || nativeImage.createFromPath('测试文本3src/image/icons/256x256.ico')从位于 path 的文件创建新的 NativeImage 实例
        show: false,
        frame: false,
        focusable: false,
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
            preload:path.join(__dirname,'src/pages/Board/preload.js')
        }
    });

    // 开发环境使用 http 协议 生产环境使用 file 协议
    if (process.env.NODE_ENV === 'dev') {
        boardWindow.loadURL(`http://localhost:3000/#/board?mainBoard=${main}`);
    } else {
        boardWindow.loadFile(`file://${__dirname}/index.html`, {hash: 'board', search: `mainBoard=${main}`});
    }

    // 当窗口关闭时发出。在你收到这个事件后，你应该删除对窗口的引用，并避免再使用它。
    boardWindow.on('close', (event) => {
        event.preventDefault();
        boardWindow.hide();
    });

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
                if (boardWindow) {
                    boardWindow.show();
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
    globalShortcut.register('Control+Shift+V', () => {
        if (boardWindow) {
            if (boardWindow.isVisible()) {
                boardWindow.hide();
            } else {
                boardWindow.show();
            }
        }
    });
}

app.on('ready', () => {
    let primaryDisplay = screen.getPrimaryDisplay();
    console.log('width:', primaryDisplay.size.width, ', height:', primaryDisplay.size.height);
    registerDefaultGlobalShortcut();
    createTray();
    createMainWindow();
    createBoardWindow("true");
    startDataClearJob();
    startClipboardListener(mainWindow, boardWindow);
    // 监听键盘事件
    uIOhook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.Escape) {
            if (boardWindow && boardWindow.isVisible()){
                boardWindow.hide();
            }
        }
    })
    // 监听鼠标点击事件（所有按键）
    // uIOhook.on('mousedown', (e) => {
    //     console.log(e.button)
    //     console.log('x:', e.x, ', y:', e.y)
    // })

    uIOhook.start()
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