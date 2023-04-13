import React, {useState} from 'react';
import {useSelector, useDispatch} from 'react-redux'
import './style.scss';
import Icon from './icon.png'

function Clip(props) {

    const {clipId, category, copyTime, appIcon, content, contentHtml} = props.data;

    const clipWidth = props.clipWidth;

    const [select, setSelect] = useState(false);

    /**
     * 双击剪贴板
     */
    function doubleClickClip() {
        window.electronAPI.selectClip(props.data);
    }

    function clickClip() {
        if (select) {
            setSelect(false);
        } else {
            setSelect(true);
        }

    }

    const titleHeight = Math.floor(clipWidth / 5);

    const contextHeight = Math.floor(clipWidth * 4 / 5);

    let clipStyle = {
        width: `${clipWidth}px`,
        height: `${clipWidth}px`,
        border: "#d9d5d1 solid 2px"
    }

    let clipSelectStyle = {
        ...clipStyle,
        border: "#377af0 solid 2px"
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

    const clipContextStyle =
        {
            width: `${clipWidth}px`,
            height: `${contextHeight}px`
        };

    return (
        <div className="clip" style={select ? clipSelectStyle : clipStyle} onClick={clickClip}
             onDoubleClick={doubleClickClip}>
            <div className="clip-title" style={clipTitleStyle}>
                <div style={{float: "left"}}>
                    <div style={categoryBoxStyle}>{category}</div>
                    <div style={copyTimeBoxStyle}>{copyTime}</div>
                </div>
                <div style={iconBoxStyle}>
                    <img src={Icon} className="app-icon"/>
                </div>
            </div>
            <div className="clip-context" style={clipContextStyle}>{content}</div>
        </div>
    )
}

export default Clip