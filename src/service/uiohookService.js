const {uIOhook, UiohookKey} = require("uiohook-napi");
const {screen} = require('electron');

const {getBoardWindows} = require('./windowService');

// 防抖变量
let lastClickTime = 0;
const CLICK_DEBOUNCE_TIME = 100; // 100ms 防抖

/**
 * 判断点击坐标是否在窗口边界内
 * @param {number} clickX - 点击的X坐标
 * @param {number} clickY - 点击的Y坐标
 * @param {Object} bounds - 窗口边界对象 {x, y, width, height}
 * @returns {boolean} 是否在窗口内
 */
function isClickInsideWindow(clickX, clickY, bounds) {
    return clickX >= bounds.x && 
           clickX <= bounds.x + bounds.width && 
           clickY >= bounds.y && 
           clickY <= bounds.y + bounds.height;
}

/**
 * 隐藏所有可见的Board窗口
 * @param {Array} visibleBoards - 可见的Board窗口数组
 */
function hideAllBoardWindows(visibleBoards) {
    console.log("点击在Board窗口外部，隐藏所有Board窗口");
    for (let board of visibleBoards) {
        try {
            console.log(`隐藏Board窗口 ${board.id}`);
            board.window.hide();
        } catch (error) {
            console.warn(`隐藏Board窗口 ${board.id} 失败:`, error.message);
        }
    }
}

/**
 * 注册键盘和鼠标监听
 */
function registerKmListener() {
    let boardWindows = getBoardWindows();
    let boards = boardWindows.boards;
    // 监听键盘事件
    uIOhook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.Escape) {
            // esc按键隐藏全部窗口
            for (let boardsKey in boards) {
                let boardWin = boards[boardsKey];
                if (boardWin.isVisible()) {
                    boardWin.hide();
                }
            }
        }
    })
    // 监听鼠标点击事件（所有按键）
    uIOhook.on('mousedown', (e) => {
        // 防抖处理，避免频繁点击
        const currentTime = Date.now();
        if (currentTime - lastClickTime < CLICK_DEBOUNCE_TIME) {
            return;
        }
        lastClickTime = currentTime;
        
        // 只处理左键点击
        if (e.button !== 1) {
            return;
        }
        
        let cursorScreenPoint = screen.getCursorScreenPoint();
        let clickX = e.x;
        let clickY = e.y;
        
        console.log("鼠标左键点击：point=x:", clickX, ",y:", clickY);
        
        try {
            // 检查点击是否在任何可见的Board窗口内
            let clickedInsideBoardWindow = false;
            let visibleBoards = [];
            
            // 先收集所有可见的Board窗口
            for (let boardId in boards) {
                let boardWindow = boards[boardId];
                
                if (boardWindow && !boardWindow.isDestroyed() && boardWindow.isVisible()) {
                    try {
                        let bounds = boardWindow.getBounds();
                        visibleBoards.push({ id: boardId, window: boardWindow, bounds });
                        console.log(`Board窗口 ${boardId} 可见:`, bounds);
                    } catch (error) {
                        console.warn(`获取Board窗口 ${boardId} 边界失败:`, error.message);
                    }
                }
            }
            
            // 检查点击是否在任何可见窗口内
            for (let board of visibleBoards) {
                let bounds = board.bounds;
                
                // 判断点击坐标是否在窗口边界内
                if (isClickInsideWindow(clickX, clickY, bounds)) {
                    clickedInsideBoardWindow = true;
                    console.log(`点击在Board窗口 ${board.id} 内部`);
                    break;
                }
            }
            
            // 如果点击不在任何Board窗口内，隐藏所有可见的Board窗口
            if (!clickedInsideBoardWindow && visibleBoards.length > 0) {
                hideAllBoardWindows(visibleBoards);
            }
        } catch (error) {
            console.error("处理鼠标点击事件时发生错误:", error);
        }
    })

    uIOhook.start()
}

/**
 * 停止键盘和鼠标事件监听
 */
function stopKmListener() {
    uIOhook.stop()
}

module.exports = {
    registerKmListener,
    stopKmListener
}