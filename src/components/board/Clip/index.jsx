import React, {useState} from 'react';
import {useSelector, useDispatch} from 'react-redux'
import './style.scss';

function Clip(props) {
    const {clipId, category, copyTime, appIcon, content, contentHtml} = props.data;

    const clipSide = props.clipWidth * 4 / 5;
    const clipBoard = clipSide / 50;
    const clipBoardSide = clipSide + 2 * clipBoard;

    const marginWidth = props.clipWidth * 1 / 20;
    const marginTop = props.clipWidth * 1 / 20;

    const dispatch = useDispatch();
    // 使用state中的数据
    const selectClipId = useSelector((state) => state.clipboard.selectClip);

    /**
     * 粘贴剪贴板
     */
    function pasteClip() {
        window.electronAPI.pasteClip(props.data);
    }

    /**
     * 选中剪贴板
     */
    function selectClip() {
        window.electronAPI.selectClip(clipId);
    }

    function selected() {
        if (selectClipId == null) {
            return false;
        }
        if (JSON.stringify(selectClipId) === JSON.stringify(clipId)) {
            return true;
        }
        return false;
    }

    const titleHeight = Math.floor(clipSide / 5);
    const contextHeight = Math.floor(clipSide * 4 / 5);

    let clipBoxStyle = {
        marginTop: `${marginTop}px`,
        marginLeft: `${marginWidth}px`,
        marginRight: `${marginWidth}px`,
        width: `${clipBoardSide}px`,
        height: `${clipBoardSide}px`,
    }

    let clipBorderStyle = {
        top: `0px`,
        left: `0px`,
        width: `${clipBoardSide}px`,
        height: `${clipBoardSide}px`,
        backgroundColor: "transparent",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
    }

    let clipStyle = {
        top: `${clipBoard}px`,
        left: `${clipBoard}px`,
        width: `${clipSide}px`,
        height: `${clipSide}px`
    }

    let clipSelectedStyle = {
        ...clipBorderStyle,
        backgroundColor: "transparent",
        boxShadow: `0 0 0 2px #0071E3, 0 4px 12px rgba(0, 113, 227, 0.2)`
    }

    const clipTitleStyle = {
        width: `${clipSide}px`,
        height: `${titleHeight}px`,
    };

    const clipContextStyle = {
        width: `${clipSide}px`,
        height: `${contextHeight}px`
    };

    // Format the content to handle different types of data
    const formatContent = () => {
        if (!content) return "无内容";
        
        // If it's likely HTML content but we're showing as text
        if (content.includes('<') && content.includes('>')) {
            // Simple strip of HTML tags for display
            return content.replace(/<[^>]*>/g, ' ').trim();
        }
        
        return content;
    };

    return (
        <div className="clip-box" style={clipBoxStyle}>
            <div className="clip-border" style={selected() ? clipSelectedStyle : clipBorderStyle}/>
            <div className="clip" style={clipStyle} onClick={selectClip} onDoubleClick={pasteClip}>
                <div className="clip-title" style={clipTitleStyle}>
                    <div className="clip-title-content">
                        <div className="category-box">{category || "文本"}</div>
                        <div className="copy-time-box">{copyTime}</div>
                    </div>
                    {appIcon && (
                        <div className="icon-box">
                            <img className="app-icon" src={appIcon} alt="App Icon" />
                        </div>
                    )}
                </div>
                <div className="clip-context" style={clipContextStyle}>
                    {formatContent()}
                </div>
            </div>
        </div>
    )
}

export default Clip