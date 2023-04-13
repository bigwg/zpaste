const {uIOhook, UiohookKey} = require("uiohook-napi");
const {screen} = require('electron');

let boardWindows = {};

/**
 * 注册键盘和鼠标监听
 * @param boardWindow
 */
function registerKmListener(boardWins) {
    boardWindows = boardWins;
    let boards = boardWindows.boards;
    // 监听键盘事件
    uIOhook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.Escape) {
            // esc按键隐藏全部窗口
            for (let boardsKey in boards) {
                let boardWin = boards[boardsKey];
                boardWin.hide();
            }
        }
    })
    // 监听鼠标点击事件（所有按键）
    uIOhook.on('mousedown', (e) => {
        let cursorScreenPoint = screen.getCursorScreenPoint();
        let displayNearestPoint = screen.getDisplayNearestPoint(cursorScreenPoint);
        let currentBoardWindow = boardWindows.boards[displayNearestPoint.id]
        console.log("鼠标点击：button=", e.button, ",point=x:", e.x, ",y:", e.y, ",window:", JSON.stringify(currentBoardWindow.getBounds()))
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