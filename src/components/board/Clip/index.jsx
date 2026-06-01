import React, {useState, forwardRef} from 'react';
import {useSelector, useDispatch} from 'react-redux'
import './style.scss';
import DefaultIcon from './icon.png'
import {t} from '../../i18n';

/**
 * 渲染剪贴板内容
 * 优先显示HTML内容，如果没有则显示纯文本
 */
function ClipContent({content, contentHtml}) {
    if (contentHtml) {
        // 使用dangerouslySetInnerHTML渲染HTML内容
        // 注意：这里需要确保HTML内容是安全的（来自用户剪贴板）
        return (
            <div
                className="clip-context-html"
                dangerouslySetInnerHTML={{__html: contentHtml}}
            />
        );
    }
    return <div className="clip-context-text">{content}</div>;
}

/**
 * 渲染应用图标
 * 如果有窗口图标则显示，否则显示默认图标
 */
function AppIcon({appIcon}) {
    if (appIcon && typeof appIcon === 'string' && appIcon.startsWith('data:')) {
        return <img src={appIcon} className="app-icon" alt="app icon"/>;
    }
    return <img src={DefaultIcon} className="app-icon" alt="default icon"/>;
}

/**
 * 格式化时间显示（使用i18n）
 */
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    // 1分钟内显示"刚刚"
    if (diffMinutes < 1) {
        return t('time.justNow');
    }
    
    // 1小时内显示"x分钟前"
    if (diffHours < 1) {
        return t('time.minutesAgo', {n: diffMinutes});
    }
    
    // 今天内显示"今天 HH:mm"
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date >= today) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${t('time.today')} ${hours}:${minutes}`;
    }
    
    // 昨天显示"昨天 HH:mm"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date >= yesterday) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${t('time.yesterday')} ${hours}:${minutes}`;
    }
    
    // 更早显示完整日期时间
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
}

const Clip = forwardRef(function Clip(props, ref) {

    const {clipId, category, copyTime, appIcon, windowTitle, content, contentHtml} = props.data;
    const {selected} = props;

    const clipWidth = props.clipWidth * 4 / 5;

    const marginWidth = props.clipWidth * 1 / 20;

    const dispatch = useDispatch();
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList);

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

    const titleHeight = Math.floor(clipWidth / 5);

    const contextHeight = Math.floor(clipWidth * 4 / 5);

    let clipStyle = {
        marginLeft: `${marginWidth}px`,
        marginRight: `${marginWidth}px`,
        width: `${clipWidth}px`,
        height: `${clipWidth}px`,
        border: selected ? "#377af0 solid 4px" : "#d9d5d1 solid 2px",
        transition: "border 0.2s ease"
    }

    const iconBoxStyle =
        {
            float: "right",
            width: `${titleHeight}px`,
            height: `${titleHeight}px`,
            overflow: "hidden"
        };

    const clipTitleStyle =
        {
            width: `${clipWidth}px`,
            height: `${titleHeight}px`,
        };

    const categoryBoxStyle =
        {
            color: "#ffffff",
            fontFamily: "Fantasy",
            fontWeight: "500",
            fontSize: "25px",
            marginTop: "10px",
            marginLeft: "30px"
        };

    const copyTimeBoxStyle =
        {
            color: "#ffffff",
            fontSize: "12px",
            marginLeft: "30px"
        };

    const windowTitleStyle =
        {
            color: "#ffffff",
            fontSize: "10px",
            marginLeft: "30px",
            opacity: 0.8,
            maxWidth: `${clipWidth * 0.6}px`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
        };

    const clipContextStyle =
        {
            width: `${clipWidth}px`,
            height: `${contextHeight}px`,
            overflow: "hidden"
        };

    // 翻译分类名称
    const translateCategory = (cat) => {
        switch(cat) {
            case '文本':
                return t('clipboard.text');
            case '富文本':
                return t('clipboard.htmlText');
            case '图片':
                return t('clipboard.image');
            default:
                return cat;
        }
    };

    return (
        <div id={clipId} ref={ref} className={`clip ${selected ? 'clip-selected' : ''}`}
             style={clipStyle} onClick={selectClip} onDoubleClick={pasteClip}>
            <div className="clip-title" style={clipTitleStyle}>
                <div style={{float: "left"}}>
                    <div style={categoryBoxStyle}>{translateCategory(category)}</div>
                    <div style={copyTimeBoxStyle}>{formatTime(copyTime)}</div>
                    {windowTitle && <div style={windowTitleStyle} title={windowTitle}>{windowTitle}</div>}
                </div>
                <div style={iconBoxStyle}>
                    <AppIcon appIcon={appIcon}/>
                </div>
            </div>
            <div className="clip-content" style={clipContextStyle}>
                <ClipContent content={content} contentHtml={contentHtml}/>
            </div>
        </div>
    )
});

export default Clip;
