import React, {useState, useEffect, useCallback, memo} from 'react';
import {useSelector, useDispatch} from 'react-redux'
import './style.scss';

const Clip = memo(function Clip(props) {
    const {clipId, category, copyTime, appIcon, content, contentHtml} = props.data;

    // 简化尺寸计算
    const clipSize = props.clipWidth;
    const margin = 8;

    const dispatch = useDispatch();
    const selectClipId = useSelector((state) => state.clipboard.selectClip);
    
    const [isClicked, setIsClicked] = useState(false);

    /**
     * 粘贴剪贴板
     */
    const pasteClip = useCallback(async () => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);
        
        try {
            console.log("前端：开始粘贴操作", props.data.content.substring(0, 30) + "...");
            await window.electronAPI.pasteClip(props.data);
            console.log("前端：粘贴操作完成");
        } catch (error) {
            console.error("前端：粘贴操作失败", error);
        }
    }, [props.data]);

    /**
     * 选中剪贴板
     */
    const selectClip = useCallback(() => {
        window.electronAPI.selectClip(clipId);
    }, [clipId]);

    const selected = useCallback(() => {
        if (selectClipId == null) {
            return false;
        }
        return JSON.stringify(selectClipId) === JSON.stringify(clipId);
    }, [selectClipId, clipId]);

    // 简化样式计算
    const clipBoxStyle = {
        margin: `${margin}px`,
        width: `${clipSize}px`,
        height: `${clipSize}px`,
    }

    const isSelected = selected();

    // 格式化内容
    const formatContent = () => {
        if (!content) return "无内容";
        const maxLength = 100;
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...' 
            : content;
    };

    // 格式化时间
    const formatTime = (timeString) => {
        if (!timeString) return '';
        try {
            const date = new Date(timeString);
            const now = new Date();
            const diffMins = Math.floor((now - date) / 60000);
            
            if (diffMins < 1) return '刚刚';
            if (diffMins < 60) return `${diffMins}分钟前`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
            return `${Math.floor(diffMins / 1440)}天前`;
        } catch (error) {
            return timeString;
        }
    };

    return (
        <div 
            className={`simple-clip-box ${isSelected ? 'selected' : ''} ${isClicked ? 'clicked' : ''}`}
            style={clipBoxStyle}
            onClick={selectClip} 
            onDoubleClick={pasteClip}
        >
            <div className="simple-clip-header">
                <span className="simple-clip-category">
                    {category || "文本"}
                </span>
                <span className="simple-clip-time">
                    {formatTime(copyTime)}
                </span>
            </div>
            
            <div className="simple-clip-content">
                {formatContent()}
            </div>
            
            {isSelected && (
                <div className="simple-clip-indicator">✓</div>
            )}
        </div>
    )
});

export default Clip;