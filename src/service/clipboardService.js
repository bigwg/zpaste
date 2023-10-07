const {CLIP_CATEGORY_TYPE, CLIP_MESSAGE_CHANNEL} = require('../common/backendConfigCons.js')
const {clipboard, NativeImage, ipcMain} = require('electron');
const robot = require("robotjs");
const {insertClip, deleteClip, pageQueryClips, deleteAll, countClips} = require('../data/clipboardData');
const {windowManager} = require("node-window-manager");

const duration = 500;

let firstOpen = true;
let beforeText, beforeImage, boardWindows, timer;

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
function addClip(text, textHtml) {
    let doc = {
        category: CLIP_CATEGORY_TYPE.TEXT.name,
        copyTime: new Date().getTime(),
        appIcon: 1,
        content: text,
        contentHtml: textHtml
    };
    insertClip(doc, (newDoc) => {
        notifyAllBoards(CLIP_MESSAGE_CHANNEL.ADD_CLIP, newDoc);
    })

}

/**
 * 选择历史剪贴板数据
 * @param data
 */
function selectClip(data) {
    // 隐藏所有剪贴板窗口
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
    deleteClip(clipId);
    notifyAllBoards(CLIP_MESSAGE_CHANNEL.REMOVE_CLIP, clipId);
}

/**
 * 分页查询
 * @param data
 */
async function pageQueryClip(queryParam) {
    let pageNum = queryParam.pageNum;
    let pageSize = queryParam.pageSize;
    let queryResults = await pageQueryClips(null, pageNum, pageSize);
    let hasMore = true;
    if (queryResults.length < pageSize) {
        hasMore = false;
    }
    return {dataList: queryResults, hasMore: hasMore};
}

/**
 * 注册消息监听器
 */
function registerMsgListener() {
    // 注册前端选择操作监听
    ipcMain.on(CLIP_MESSAGE_CHANNEL.SELECT_CLIP, (event, data) => {
        selectClip(data);
    });
    // 注册前端翻页操作监听
    ipcMain.handle(CLIP_MESSAGE_CHANNEL.PAGE_QUERY_CLIP, async (event, data) => {
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@收到PAGE_QUERY_CLIP请求")
        return await pageQueryClip(data)
    })
}

/**
 * 通知所有剪贴板页面
 * @param event
 * @param data
 */
function notifyAllBoards(event, data) {
    let boards = boardWindows.boards;
    for (let boardsKey in boards) {
        let currentBoard = boards[boardsKey];
        currentBoard.webContents.send(event, data)
    }
}

/**
 * 开启剪贴板监听
 * @param mainWindow
 * @param boardWindow
 */
function startClipboardListener(boardWins) {
    boardWindows = boardWins;
    //  设置定时器
    timer = setInterval(() => {
        let text = clipboard.readText();
        let textHtml = clipboard.readHTML();
        handleHtmlText(textHtml, text);
        let image = clipboard.readImage();
        handleImage(image);
    }, duration);
    // deleteAll();
    // 初始化剪贴板列表
    let boards = boardWindows.boards;
    for (let boardsKey in boards) {
        let currentBoard = boards[boardsKey];
        currentBoard.on('ready-to-show', (event) => {
            pageQueryClips(null, 1, 20).then((docs) => {
                for (let docsKey in docs) {
                    let doc = docs[docsKey];
                    doc.clipId = doc._id;
                }
                currentBoard.webContents.send(CLIP_MESSAGE_CHANNEL.APPEND_CLIPS, docs)
            })
        });
    }
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