const robot = require("robotjs");
const {windowManager} = require("node-window-manager");
const {clipboard, NativeImage, ipcMain} = require('electron');

const {CLIP_CATEGORY_TYPE, CLIP_MESSAGE_CHANNEL} = require('../common/backendConfigCons')
const {getBoardWindows} = require('../service/boardWindowService');
const {insertClip, selectClip: selectClipData, pasteClip: pasteClipData, pageQueryClips, getBoard} = require('../data/clipData');
const {paste} = require("@testing-library/user-event/dist/paste");

const duration = 500;

let firstOpen = true;
let beforeText, beforeImage, timer;

/**
 * 判断内容是否不一致
 * @param beforeText
 * @param afterText
 * @returns
 */
function isDiffText(beforeText, afterText) {
    if (!beforeText) {
        return true;
    }
    return beforeText !== afterText;
}

/**
 * 判断图片是否不一致
 * @param beforeImage
 * @param afterImage
 * @returns
 */
function isDiffImage(beforeImage, afterImage) {
    if (!beforeImage) {
        return;
    }
    return beforeImage.toDataURL() !== afterImage.toDataURL();
}

function handleHtmlText(textHtml, text) {
    if (!text) {
        return;
    }
    //  判断内容是否与上次读取的内容不同
    if (isDiffText(beforeText, text)) {
        if (firstOpen) {
            beforeText = text;
            firstOpen = false;
            return;
        }
        const window = windowManager.getActiveWindow();
        console.log("复制窗口title：", window.getTitle(), ", icon: ", window.getIcon())
        //  执行变动回调
        console.log(text);
        console.log(textHtml);
        addClip(text, textHtml);
        //  记录此次内容
        beforeText = text;
    }
}

function handleImage(image) {
    // 判断内容是否与上次读取的内容不同
    if (isDiffImage(beforeImage, image)) {
        if (firstOpen) {
            beforeImage = image;
            firstOpen = false;
            return;
        }
        //  执行变动回调
        console.log(image.toDataURL());
        //  记录此次内容
        beforeImage = image;
    }
}

/**
 * 新增剪贴板，先存入nedb，再通知redux新增
 * @param text
 * @param textHtml
 */
async function addClip(text, textHtml) {
    let doc = {
        category: CLIP_CATEGORY_TYPE.TEXT.name,
        copyTime: new Date().getTime(),
        appIcon: 1,
        content: text,
        contentHtml: textHtml
    };
    // 新增
    await insertClip(doc);
    notifyAllBoards();
}

/**
 * 粘贴历史剪贴板数据
 * @param data
 */
function pasteClip(data) {
    // 隐藏所有剪贴板窗口
    let boardWindows = getBoardWindows();
    let boards = boardWindows.boards;
    for (let boardsKey in boards) {
        let boardWin = boards[boardsKey];
        boardWin.hide();
    }
    clipboard.write({text: data.content, html: data.contentHtml});
    robot.keyTap('v', 'control');
    // 移除nedb中的数据和redux中的目标数据
    let clipId = data.clipId;
    console.log("选中要删除的文档id：", clipId)
    pasteClipData(clipId);
    notifyAllBoards();
}

/**
 * 选择历史剪贴板数据
 * @param data
 */
function selectClip(clipId) {
    selectClipData(clipId);
    notifyAllBoards();
}

/**
 * 初始化剪贴板
 * @param boardKey
 */
function initBoard(boardKey) {
    let boardWindows = getBoardWindows();
    console.log("boardKey:", boardKey, ", boardWindows:", boardWindows)
    // 用最新的board数据通知前端
    notifyBoard(boardKey);
}

/**
 * 分页查询
 * @param data
 */
async function pageQueryClip(queryParam) {
    let pageNum = queryParam.pageNum;
    let pageSize = queryParam.pageSize;
    await pageQueryClips(null, pageNum, pageSize);
    notifyAllBoards();
}

/**
 * 注册消息监听器
 */
function registerMsgListener() {
    // 注册前端选择操作监听
    ipcMain.on(CLIP_MESSAGE_CHANNEL.INIT_BOARD, (event, boardKey) => {
        initBoard(boardKey);
    });
    ipcMain.on(CLIP_MESSAGE_CHANNEL.SELECT_CLIP, (event, data) => {
        selectClip(data);
    });
    ipcMain.on(CLIP_MESSAGE_CHANNEL.PASTE_CLIP, (event, data) => {
        pasteClip(data);
    });
    // 注册前端翻页操作监听
    ipcMain.on(CLIP_MESSAGE_CHANNEL.PAGE_QUERY_CLIP, (event, data) => {
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@收到PAGE_QUERY_CLIP请求")
        pageQueryClip(data)
    })
}

/**
 * 通知所有剪贴板页面更新
 * @param data
 */
async function notifyAllBoards(data) {
    if (data === undefined){
        data = await getBoard();
    }
    let boardWindows = getBoardWindows();
    let boards = boardWindows.boards;
    for (let boardsKey in boards) {
        let currentBoard = boards[boardsKey];
        currentBoard.webContents.send(CLIP_MESSAGE_CHANNEL.UPDATE_BOARD, data)
    }
}

/**
 * 通知剪贴板页面更新
 * @param boardKey
 * @param data
 */
async function notifyBoard(boardKey, data) {
    if (data === undefined){
        data = await getBoard();
    }
    console.log("notifyBoard - boardKey: ", boardKey, ", data:", data)
    let boardWindows = getBoardWindows();
    let targetBoard = boardWindows.boards[boardKey];
    console.log("notifyBoard----------------targetBoard:", targetBoard)
    if (targetBoard !== null) {
        targetBoard.webContents.send(CLIP_MESSAGE_CHANNEL.UPDATE_BOARD, data)
    }
}

/**
 * 开启剪贴板监听
 * @param mainWindow
 * @param boardWindow
 */
async function startClipboardListener() {
    // 设置定时器
    timer = setInterval(() => {
        let text = clipboard.readText();
        let textHtml = clipboard.readHTML();
        handleHtmlText(textHtml, text);
        let image = clipboard.readImage();
        handleImage(image);
    }, duration);
    // 注册消息监听器
    registerMsgListener();
}

function stopClipboardListener() {
    clearInterval(timer);
}

module.exports = {
    startClipboardListener,
    stopClipboardListener
};