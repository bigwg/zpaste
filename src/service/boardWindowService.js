const {BrowserWindow, nativeImage} = require('electron');
const path = require('path');

let mainWindow = null;
let boardWindows = {};

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

/**
 * 创建剪贴板窗口
 * @param main
 * @param display
 */
function createBoardWindow(main, display) {
    let bounds = display.bounds;
    let width = Math.floor(bounds.width);
    let height = Math.floor(bounds.height * 4 / 10);
    let workArea = display.workArea;
    let x = workArea.x;
    let y = workArea.y;
    let displayId = display.id;
    console.log("创建窗口：", displayId, ",display:", display, ",width:", width, ",height:", height)
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
        boardWindow.loadURL(`http://localhost:3000/#/board?width=${width}&height=${height}&displayId=${displayId}`);
    } else {
        boardWindow.loadFile(`file://${__dirname}/index.html`, {
            hash: 'board',
            search: `width=${width}&height=${height}&displayId=${displayId}`
        });
    }

    // 解决屏幕无法铺满的问题
    boardWindow.setBounds({
        width: width,
        height: height,
        x: x,
        y: y,
    })

    if (main === 'true') {
        boardWindows.mainBoardId = displayId;
        boardWindows.mainBoard = boardWindow;
    }
    boardWindows.boards = {[displayId]: boardWindow, ...boardWindows.boards};

}

function getMainWindow() {
    return mainWindow;
}

function setMainWindow(window) {
    mainWindow = window;
}

function getBoardWindows() {
    return boardWindows;
}

function setBoardWindows(windows) {
    boardWindows = windows;
}

module.exports = {
    createMainWindow,
    createBoardWindow,
    getMainWindow,
    setMainWindow,
    getBoardWindows,
    setBoardWindows,
};