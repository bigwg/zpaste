const {clipboard, NativeImage} = require('electron');
const robot = require("robotjs");

let currentClipId = 5;
let firstOpen = true;
let duration = 500;
let beforeText, beforeImage, settingWindow, clipboardWindow;

/**
 * 判断内容是否不一致
 * @param beforeText
 * @param afterText
 * @returns
 */
function isDiffText(beforeText, afterText) {
    if (!beforeText){
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
    if (!beforeImage){
        return true;
    }
    return beforeImage.toDataURL() !== afterImage.toDataURL();

}

function handleHtmlText(textHtml, text) {
    if (!!text){
        return;
    }
    //  判断内容是否与上次读取的内容不同
    if (isDiffText(beforeText, text)) {
        if (firstOpen){
            beforeText = text;
            firstOpen = false;
            return;
        }
        //  执行变动回调
        console.log(text);
        console.log(textHtml);
        currentClipId++;
        let data = {clipId: currentClipId, category: '文本', copyTime: '43分钟前', appIcon: 1, content: text, contentHtml: textHtml};
        clipboardWindow.webContents.send('add-clipboard', data)
        //  记录此次内容
        beforeText = text;
    }
}

function handleImage(image) {
//  判断内容是否与上次读取的内容不同
    if (isDiffImage(beforeImage, image)) {
        if (firstOpen){
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

let timer;

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
}

function stopClipboardListener() {
    timer.clearInterval();
}

function pasteClip(data){
    clipboardWindow.hide()
    robot.keyTap('v', 'control');

    // clipboard.writeText(data.content);
    // if (!!data.contentHtml){
    //     clipboard.writeHTML(data.contentHtml)
    // }
}

module.exports = {startClipboardListener, stopClipboardListener, pasteClip};