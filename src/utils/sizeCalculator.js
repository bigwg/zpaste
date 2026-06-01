/**
 * 动态尺寸计算配置
 * 根据屏幕分辨率自动计算UI元素尺寸
 */

/**
 * 计算board窗口尺寸
 * @param {Object} displayBounds - 屏幕边界 {x, y, width, height}
 * @param {Object} workArea - 工作区域 {x, y, width, height}
 * @returns {Object} 窗口尺寸 {width, height, x, y}
 */
function calculateBoardWindowSize(displayBounds, workArea) {
    const screenWidth = displayBounds.width;
    const screenHeight = displayBounds.height;
    
    // 根据屏幕分辨率动态计算高度比例
    let heightRatio;
    if (screenHeight >= 2160) {
        // 4K屏幕：30%
        heightRatio = 0.3;
    } else if (screenHeight >= 1440) {
        // 2K屏幕：35%
        heightRatio = 0.35;
    } else if (screenHeight >= 1080) {
        // 1080p屏幕：40%
        heightRatio = 0.4;
    } else {
        // 小屏幕：45%
        heightRatio = 0.45;
    }
    
    // 宽度使用工作区域宽度（排除任务栏）
    const width = Math.floor(workArea.width);
    const height = Math.floor(screenHeight * heightRatio);
    
    // 位置使用工作区域起点
    const x = workArea.x;
    const y = workArea.y;
    
    return { width, height, x, y };
}

/**
 * 计算clip卡片尺寸
 * @param {number} boardHeight - board窗口高度
 * @param {number} boardWidth - board窗口宽度
 * @returns {Object} clip相关尺寸 {clipWidth, marginWidth, titleHeight, contextHeight}
 */
function calculateClipSize(boardHeight, boardWidth) {
    // clip宽度基于board高度计算
    const clipWidth = Math.floor(boardHeight * 7 / 8);
    
    // margin基于clip宽度
    const marginWidth = Math.floor(clipWidth / 20);
    
    // 标题区域高度
    const titleHeight = Math.floor(clipWidth / 5);
    
    // 内容区域高度
    const contextHeight = Math.floor(clipWidth * 4 / 5);
    
    return {
        clipWidth,
        marginWidth,
        titleHeight,
        contextHeight
    };
}

/**
 * 计算字体大小
 * @param {number} clipWidth - clip卡片宽度
 * @returns {Object} 字体大小配置
 */
function calculateFontSizes(clipWidth) {
    // 基础字体大小基于clip宽度的比例
    const baseFontSize = Math.max(12, Math.floor(clipWidth / 20));
    
    return {
        categoryFontSize: Math.floor(baseFontSize * 2), // 分类字体较大
        timeFontSize: baseFontSize, // 时间字体
        windowTitleFontSize: Math.floor(baseFontSize * 0.8), // 窗口标题字体较小
        contentFontSize: baseFontSize, // 内容字体
    };
}

/**
 * 计算每行显示的clip数量
 * @param {number} boardWidth - board窗口宽度
 * @param {number} clipWidth - clip卡片宽度
 * @param {number} marginWidth - margin宽度
 * @returns {number} 每行clip数量
 */
function calculateClipsPerRow(boardWidth, clipWidth, marginWidth) {
    const clipTotalWidth = clipWidth + marginWidth * 2;
    return Math.max(1, Math.floor(boardWidth / clipTotalWidth));
}

/**
 * 获取响应式尺寸配置
 * @param {Object} display - 屏幕信息 {bounds, workArea}
 * @returns {Object} 完整的尺寸配置
 */
function getResponsiveSizes(display) {
    const boardSize = calculateBoardWindowSize(display.bounds, display.workArea);
    const clipSize = calculateClipSize(boardSize.height, boardSize.width);
    const fontSizes = calculateFontSizes(clipSize.clipWidth);
    const clipsPerRow = calculateClipsPerRow(boardSize.width, clipSize.clipWidth, clipSize.marginWidth);
    
    return {
        board: boardSize,
        clip: clipSize,
        font: fontSizes,
        layout: {
            clipsPerRow,
            clipGap: clipSize.marginWidth * 2
        }
    };
}

module.exports = {
    calculateBoardWindowSize,
    calculateClipSize,
    calculateFontSizes,
    calculateClipsPerRow,
    getResponsiveSizes
};
