/**
 * 尺寸计算工具单元测试
 */

const {
    calculateBoardWindowSize,
    calculateClipSize,
    calculateFontSizes,
    calculateClipsPerRow,
    getResponsiveSizes
} = require('../sizeCalculator');

describe('尺寸计算工具测试', () => {
    
    describe('calculateBoardWindowSize', () => {
        test('4K屏幕应该使用30%高度比例', () => {
            const bounds = {width: 3840, height: 2160};
            const workArea = {x: 0, y: 0, width: 3840, height: 2160};
            const result = calculateBoardWindowSize(bounds, workArea);
            
            expect(result.width).toBe(3840);
            expect(result.height).toBe(Math.floor(2160 * 0.3));
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });
        
        test('2K屏幕应该使用35%高度比例', () => {
            const bounds = {width: 2560, height: 1440};
            const workArea = {x: 0, y: 0, width: 2560, height: 1440};
            const result = calculateBoardWindowSize(bounds, workArea);
            
            expect(result.width).toBe(2560);
            expect(result.height).toBe(Math.floor(1440 * 0.35));
        });
        
        test('1080p屏幕应该使用40%高度比例', () => {
            const bounds = {width: 1920, height: 1080};
            const workArea = {x: 0, y: 0, width: 1920, height: 1080};
            const result = calculateBoardWindowSize(bounds, workArea);
            
            expect(result.width).toBe(1920);
            expect(result.height).toBe(Math.floor(1080 * 0.4));
        });
        
        test('小屏幕应该使用45%高度比例', () => {
            const bounds = {width: 1366, height: 768};
            const workArea = {x: 0, y: 0, width: 1366, height: 768};
            const result = calculateBoardWindowSize(bounds, workArea);
            
            expect(result.width).toBe(1366);
            expect(result.height).toBe(Math.floor(768 * 0.45));
        });
        
        test('应该使用工作区域的坐标', () => {
            const bounds = {width: 1920, height: 1080};
            const workArea = {x: 100, y: 50, width: 1820, height: 1030};
            const result = calculateBoardWindowSize(bounds, workArea);
            
            expect(result.x).toBe(100);
            expect(result.y).toBe(50);
            expect(result.width).toBe(1820);
        });
    });
    
    describe('calculateClipSize', () => {
        test('应该正确计算clip尺寸', () => {
            const result = calculateClipSize(400, 1920);
            
            expect(result.clipWidth).toBe(Math.floor(400 * 7 / 8));
            expect(result.marginWidth).toBe(Math.floor(result.clipWidth / 20));
            expect(result.titleHeight).toBe(Math.floor(result.clipWidth / 5));
            expect(result.contextHeight).toBe(Math.floor(result.clipWidth * 4 / 5));
        });
        
        test('小尺寸应该正确缩放', () => {
            const result = calculateClipSize(200, 800);
            
            expect(result.clipWidth).toBe(175);
            expect(result.marginWidth).toBe(8);
            expect(result.titleHeight).toBe(35);
            expect(result.contextHeight).toBe(140);
        });
    });
    
    describe('calculateFontSizes', () => {
        test('应该返回合理的字体大小', () => {
            const result = calculateFontSizes(300);
            
            expect(result.categoryFontSize).toBeGreaterThanOrEqual(24);
            expect(result.timeFontSize).toBeGreaterThanOrEqual(12);
            expect(result.windowTitleFontSize).toBeGreaterThanOrEqual(10);
            expect(result.contentFontSize).toBeGreaterThanOrEqual(12);
        });
        
        test('小尺寸应该有最小字体限制', () => {
            const result = calculateFontSizes(100);
            
            expect(result.categoryFontSize).toBeGreaterThanOrEqual(24);
            expect(result.timeFontSize).toBeGreaterThanOrEqual(12);
        });
    });
    
    describe('calculateClipsPerRow', () => {
        test('应该正确计算每行clip数量', () => {
            const clipWidth = 300;
            const marginWidth = 15;
            const boardWidth = 1920;
            
            const result = calculateClipsPerRow(boardWidth, clipWidth, marginWidth);
            const expected = Math.floor(boardWidth / (clipWidth + marginWidth * 2));
            
            expect(result).toBe(expected);
        });
        
        test('至少应该返回1', () => {
            const result = calculateClipsPerRow(100, 300, 15);
            expect(result).toBe(1);
        });
    });
    
    describe('getResponsiveSizes', () => {
        test('应该返回完整的尺寸配置', () => {
            const display = {
                bounds: {width: 1920, height: 1080, x: 0, y: 0},
                workArea: {width: 1920, height: 1080, x: 0, y: 0}
            };
            
            const result = getResponsiveSizes(display);
            
            expect(result).toHaveProperty('board');
            expect(result).toHaveProperty('clip');
            expect(result).toHaveProperty('font');
            expect(result).toHaveProperty('layout');
            expect(result.layout).toHaveProperty('clipsPerRow');
            expect(result.layout).toHaveProperty('clipGap');
        });
        
        test('所有尺寸应该是正数', () => {
            const display = {
                bounds: {width: 1920, height: 1080, x: 0, y: 0},
                workArea: {width: 1920, height: 1080, x: 0, y: 0}
            };
            
            const result = getResponsiveSizes(display);
            
            expect(result.board.width).toBeGreaterThan(0);
            expect(result.board.height).toBeGreaterThan(0);
            expect(result.clip.clipWidth).toBeGreaterThan(0);
            expect(result.clip.marginWidth).toBeGreaterThan(0);
        });
    });
});
