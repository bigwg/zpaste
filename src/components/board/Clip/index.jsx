import React, {useState} from 'react';
import {useSelector, useDispatch} from 'react-redux'
import './style.scss';
import Icon from './icon.png'

function Clip(props) {

    const {clipId, category, copyTime, appIcon, content, contentHtml} = props.data;

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

    const iconBoxStyle =
        {
            float: "right",
            height: "70px",
            width: "70px",
            overflow: "hidden"
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

    return (
        <div className={select ? "clip-select" : "clip"} onClick={clickClip} onDoubleClick={doubleClickClip}>
            <div className="clip-title">
                <div style={{float: "left"}}>
                    <div style={categoryBoxStyle}>{category}</div>
                    <div style={copyTimeBoxStyle}>{copyTime}</div>
                </div>
                <div style={iconBoxStyle}>
                    <img src={Icon} className="app-icon"/>
                </div>
            </div>
            <div className="clip-context">{content}</div>
        </div>
    )
}

export default Clip