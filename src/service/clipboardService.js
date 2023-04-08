const {CLIP_CATEGORY_TYPE, CLIP_MESSAGE_CHANNEL} = require('../common/backendConfigCons.js')
const {clipboard, NativeImage, ipcMain} = require('electron');
const robot = require("robotjs");
const {insertClip, deleteClip, pageQueryClips, deleteAll} = require('../data/clipboardData');
const duration = 500;

let firstOpen = true;
let beforeText, beforeImage, settingWindow, clipboardWindow, timer;

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
        //  执行变动回调
        console.log(text);
        console.log(textHtml);
        addClip(text, textHtml);
        //  记录此次内容
        beforeText = text;
    }
}

function handleImage(image) {
//  判断内容是否与上次读取的内容不同
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
        clipboardWindow.webContents.send(CLIP_MESSAGE_CHANNEL.ADD_CLIP, newDoc)
    })

}

/**
 * 选择历史剪贴板数据
 * @param data
 */
function selectClip(data) {
    // 写入剪贴板缓冲区
    clipboardWindow.hide();
    clipboard.write({text: data.content, html: data.contentHtml});
    robot.keyTap('v', 'control');
    // 移除nedb中的数据和redux中的目标数据
    let clipId = data.clipId;
    console.log("选中要删除的文档id：", clipId)
    deleteClip(clipId);
    clipboardWindow.webContents.send(CLIP_MESSAGE_CHANNEL.REMOVE_CLIP, clipId)
}

/**
 * 分页查询
 * @param data
 */
function pageClip(data) {

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
    ipcMain.on(CLIP_MESSAGE_CHANNEL.PAGE_CLIP, (event, data) => {
        pageClip(data);
    })
}

/**
 * 开启剪贴板监听
 * @param mainWindow
 * @param boardWindow
 */
function startClipboardListener(mainWindow, boardWindow) {
    settingWindow = mainWindow;
    clipboardWindow = boardWindow;

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
    boardWindow.on('ready-to-show', (event) => {
        pageQueryClips(null, 1, 20, (docs) => {
            console.log("nedb中的文档：", JSON.stringify(docs));
            for (let docsKey in docs) {
                let doc = docs[docsKey];
                doc.clipId = doc._id;
            }
            console.log("返回前端的文档：", JSON.stringify(docs));
            clipboardWindow.webContents.send(CLIP_MESSAGE_CHANNEL.INIT_CLIP, docs)
        })
    });
    // 注册消息监听器
    registerMsgListener();
}

function stopClipboardListener() {
    timer.clearInterval();
}

module.exports = {
    startClipboardListener,
    stopClipboardListener
};