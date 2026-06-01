/**
 * Clip组件单元测试
 */

import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import Clip from '../Clip';

// Mock i18n
jest.mock('../../../i18n', () => ({
    t: (key, params) => {
        const translations = {
            'clipboard.text': '文本',
            'clipboard.htmlText': '富文本',
            'clipboard.image': '图片',
            'time.justNow': '刚刚',
            'time.minutesAgo': '{n}分钟前',
            'time.today': '今天',
            'time.yesterday': '昨天'
        };
        let result = translations[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                result = result.replace(`{${k}}`, v);
            });
        }
        return result;
    }
}));

// Mock electronAPI
window.electronAPI = {
    selectClip: jest.fn(),
    pasteClip: jest.fn()
};

describe('Clip组件测试', () => {
    const defaultProps = {
        data: {
            clipId: 'test-clip-1',
            category: '文本',
            copyTime: Date.now(),
            appIcon: 1,
            windowTitle: 'Test Window',
            content: 'Hello World',
            contentHtml: null
        },
        clipWidth: 300,
        selected: false
    };
    
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    test('应该正确渲染纯文本内容', () => {
        render(<Clip {...defaultProps} />);
        
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByText('文本')).toBeInTheDocument();
    });
    
    test('应该正确渲染HTML内容', () => {
        const propsWithHtml = {
            ...defaultProps,
            data: {
                ...defaultProps.data,
                contentHtml: '<b>Bold Text</b>'
            }
        };
        
        render(<Clip {...propsWithHtml} />);
        
        const htmlContent = screen.getByText('Bold Text');
        expect(htmlContent).toBeInTheDocument();
        expect(htmlContent.tagName).toBe('B');
    });
    
    test('应该显示窗口标题', () => {
        render(<Clip {...defaultProps} />);
        
        expect(screen.getByText('Test Window')).toBeInTheDocument();
    });
    
    test('点击应该触发selectClip', () => {
        render(<Clip {...defaultProps} />);
        
        const clipElement = screen.getByText('Hello World').closest('.clip');
        fireEvent.click(clipElement);
        
        expect(window.electronAPI.selectClip).toHaveBeenCalledWith('test-clip-1');
    });
    
    test('双击应该触发pasteClip', () => {
        render(<Clip {...defaultProps} />);
        
        const clipElement = screen.getByText('Hello World').closest('.clip');
        fireEvent.doubleClick(clipElement);
        
        expect(window.electronAPI.pasteClip).toHaveBeenCalledWith(defaultProps.data);
    });
    
    test('选中状态应该有特殊样式', () => {
        const {rerender} = render(<Clip {...defaultProps} selected={false} />);
        
        let clipElement = screen.getByText('Hello World').closest('.clip');
        expect(clipElement).not.toHaveClass('clip-selected');
        
        rerender(<Clip {...defaultProps} selected={true} />);
        
        clipElement = screen.getByText('Hello World').closest('.clip');
        expect(clipElement).toHaveClass('clip-selected');
    });
    
    test('应该显示格式化的时间', () => {
        const oneMinuteAgo = Date.now() - 60 * 1000;
        const propsWithTime = {
            ...defaultProps,
            data: {
                ...defaultProps.data,
                copyTime: oneMinuteAgo
            }
        };
        
        render(<Clip {...propsWithTime} />);
        
        expect(screen.getByText('1分钟前')).toBeInTheDocument();
    });
    
    test('应该显示默认图标当appIcon不是base64时', () => {
        render(<Clip {...defaultProps} />);
        
        const icon = screen.getByAltText('default icon');
        expect(icon).toBeInTheDocument();
    });
    
    test('应该显示窗口图标当appIcon是base64时', () => {
        const propsWithIcon = {
            ...defaultProps,
            data: {
                ...defaultProps.data,
                appIcon: 'data:image/png;base64,test123'
            }
        };
        
        render(<Clip {...propsWithIcon} />);
        
        const icon = screen.getByAltText('app icon');
        expect(icon).toBeInTheDocument();
        expect(icon.src).toContain('data:image/png;base64,test123');
    });
    
    test('没有窗口标题时不应该显示标题元素', () => {
        const propsWithoutTitle = {
            ...defaultProps,
            data: {
                ...defaultProps.data,
                windowTitle: ''
            }
        };
        
        render(<Clip {...propsWithoutTitle} />);
        
        expect(screen.queryByText('Test Window')).not.toBeInTheDocument();
    });
});
