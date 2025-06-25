const robot = require("robotjs");
const {windowManager} = require("node-window-manager");
const {clipboard, NativeImage, ipcMain, shell} = require('electron');

const {CLIP_CATEGORY_TYPE, CLIP_MESSAGE_CHANNEL} = require('../common/backendConfigCons')
const {getBoardWindows} = require('./windowService');
const {insertClip, selectClip: selectClipData, pasteClip: pasteClipData, pageQueryClips, getBoard} = require('../data/clipData');
const {paste} = require("@testing-library/user-event/dist/paste");

const duration = 500;

let firstOpen = true;
let beforeText, beforeImage, timer;
// 记录显示剪贴板窗口之前的活跃窗口
let previousActiveWindow = null;

/**
 * 记录当前活跃窗口（在显示剪贴板窗口之前调用）
 */
function recordActiveWindow() {
    try {
        const activeWindow = windowManager.getActiveWindow();
        if (activeWindow) {
            const windowTitle = activeWindow.getTitle();
            // 排除我们自己的窗口
            if (windowTitle !== 'zpaste' && windowTitle !== 'Electron') {
                previousActiveWindow = {
                    window: activeWindow,
                    title: windowTitle,
                    timestamp: Date.now()
                };
                console.log("记录活跃窗口:", windowTitle);
                return true;
            }
        }
    } catch (error) {
        console.error("记录活跃窗口失败:", error);
    }
    return false;
}

/**
 * 清除记录的活跃窗口
 */
function clearActiveWindow() {
    previousActiveWindow = null;
}

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
async function pasteClip(data) {
    console.log("开始粘贴操作, 当前平台:", process.platform);
    
    // 使用之前记录的活跃窗口
    let targetWindow = previousActiveWindow;
    console.log("目标窗口:", targetWindow ? targetWindow.title : "无记录的活跃窗口");
    
    // 隐藏所有剪贴板窗口
    let boardWindows = getBoardWindows();
    let boards = boardWindows.boards;
    for (let boardsKey in boards) {
        let boardWin = boards[boardsKey];
        if (boardWin.isVisible()) {
            boardWin.hide();
        }
    }
    
    // 等待窗口完全隐藏
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 设置剪贴板内容
    clipboard.write({text: data.content, html: data.contentHtml});
    console.log("剪贴板内容已设置:", data.content.substring(0, 50) + "...");
    
    // 尝试激活目标窗口
    if (targetWindow && targetWindow.window) {
        try {
            if (process.platform === 'darwin') {
                // macOS特殊处理：使用多种方法激活目标窗口
                console.log("尝试激活目标窗口:", targetWindow.title);
                
                // 方法1：直接激活窗口
                targetWindow.window.bringToTop();
                
                // 方法2：使用AppleScript通过应用名激活
                const { exec } = require('child_process');
                
                // 尝试通过窗口标题获取应用名并激活
                const escapedTitle = targetWindow.title.replace(/'/g, "\\'");
                const applescript = `
                    tell application "System Events"
                        set windowTitle to "${escapedTitle}"
                        set appName to ""
                        
                        -- 尝试通过窗口标题找到应用
                        repeat with proc in application processes
                            try
                                set windowList to windows of proc
                                repeat with win in windowList
                                    if name of win is windowTitle then
                                        set appName to name of proc
                                        exit repeat
                                    end if
                                end repeat
                                if appName is not "" then exit repeat
                            end try
                        end repeat
                        
                        -- 如果找到应用，激活它
                        if appName is not "" then
                            tell application appName to activate
                            return "success: " & appName
                        else
                            -- 备用方案：尝试点击窗口
                            click (first window whose name is windowTitle)
                            return "clicked window"
                        end if
                    end tell`;
                
                exec(`osascript -e '${applescript}'`, (error, stdout, stderr) => {
                    if (error) {
                        console.log("AppleScript激活失败:", error.message);
                    } else {
                        console.log("AppleScript激活成功:", stdout.trim());
                    }
                });
                
            } else {
                // Windows/Linux处理
                targetWindow.window.bringToTop();
                console.log("已尝试激活窗口:", targetWindow.title);
            }
        } catch (error) {
            console.error("激活目标窗口失败:", error);
        }
    } else {
        console.log("没有记录的目标窗口，尝试获取当前活跃窗口");
        // 备用方案：如果没有记录的窗口，尝试获取当前活跃窗口
        try {
            const currentActive = windowManager.getActiveWindow();
            if (currentActive && currentActive.getTitle() !== 'zpaste' && currentActive.getTitle() !== 'Electron') {
                currentActive.bringToTop();
                console.log("使用当前活跃窗口:", currentActive.getTitle());
            }
        } catch (error) {
            console.error("获取当前活跃窗口失败:", error);
        }
    }
    
    // 再等待一小段时间确保窗口切换完成
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 根据平台使用不同的粘贴快捷键
    try {
        if (process.platform === 'darwin') {
            // macOS使用cmd+v
            robot.keyTap('v', 'command');
            console.log("执行macOS粘贴操作: cmd+v");
        } else {
            // Windows/Linux使用ctrl+v
            robot.keyTap('v', 'control');
            console.log("执行Windows/Linux粘贴操作: ctrl+v");
        }
        
        // 验证粘贴是否成功
        setTimeout(() => {
            const currentClipboard = clipboard.readText();
            if (currentClipboard === data.content) {
                console.log("粘贴操作验证成功");
            } else {
                console.log("粘贴操作可能失败，剪贴板内容不匹配");
            }
        }, 200);
        
    } catch (error) {
        console.error("robotjs粘贴操作失败:", error);
        
        // 备用方案：使用AppleScript（仅macOS）
        if (process.platform === 'darwin') {
            console.log("尝试使用AppleScript备用粘贴方法...");
            const { exec } = require('child_process');
            const applescript = `tell application "System Events"
                keystroke "v" using command down
            end tell`;
            exec(`osascript -e '${applescript}'`, (error, stdout, stderr) => {
                if (error) {
                    console.error("AppleScript粘贴也失败:", error);
                } else {
                    console.log("AppleScript粘贴执行完成");
                }
            });
        } else {
            console.log("非macOS系统，无备用粘贴方案");
        }
    }
    
    // 移除nedb中的数据和redux中的目标数据
    let clipId = data.clipId;
    console.log("选中要删除的文档id：", clipId)
    await pasteClipData(clipId);
    notifyAllBoards();
}

/**
 * 选择历史剪贴板数据
 * @param data
 */
async function selectClip(clipId) {
    await selectClipData(clipId);
    notifyAllBoards();
}

/**
 * 初始化剪贴板
 * @param boardKey
 */
async function initBoard(boardKey) {
    let boardWindows = getBoardWindows();
    console.log("初始化Board窗口 - boardKey:", boardKey, ", 所有窗口:", Object.keys(boardWindows.boards || {}))
    
    // 确保数据已经加载，然后通知所有Board窗口
    const boardData = await getBoard();
    console.log("Board数据加载完成，clipList长度:", boardData?.clipList?.length || 0);
    
    // 通知所有Board窗口，确保数据同步
    await notifyAllBoards(boardData);
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
    stopClipboardListener,
    recordActiveWindow,
    clearActiveWindow
};