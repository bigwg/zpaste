import React, {useEffect} from 'react';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {addClip, initClip, removeClip} from "../../store/clipboard.js";

function Board(props) {

    // const { mainBoard } = props.location;
    const { width, height } = parseUrlParam(props.location.search);
    const clipWidth = Math.floor(height * 7 / 8);

    const dispatch = useDispatch()
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList)

    useEffect(() => {
        let info = "boardWindow初始化：width=" + width + ", height="+height+", clipWidth="+clipWidth;
        // alert(info)
        // 新增剪贴板
        window.electronAPI.addClip((_event, clip) => {
            console.log('新增复制内容：', clip)
            dispatch(addClip(clip))
        });
        // 初始化剪贴板
        window.electronAPI.initClip((_event, clips) => {
            console.log('初始化剪贴板内容：', clips)
            dispatch(initClip(clips))
        });
        // 移除剪贴板内容
        window.electronAPI.removeClip((_event, clipId) => {
            console.log('移除剪贴板内容：', clipId)
            dispatch(removeClip(clipId))
        });
    }, [])

    const buildBoardWidth = () => {
        let boardWidth = (clipList.length + 1) * clipWidth;
        return boardWidth + 20;
    }

    const boardWwStyle = {
        backgroundColor: "#d9d5d1",
        height: `${height}px`,
        width: `${width}px`,
        overflow: "hidden"
    }

    const boardWStyle = {
        backgroundColor: "#d9d5d1",
        height: `${height + 20}px`,
        width: `${width}px`,
        overflowX: "scroll"
    }

    const boardStyle = {
        width: buildBoardWidth(),
        backgroundColor: "#d9d5d1",
        overflow: "hidden"
    }

    const buildClips = () => {
        console.log(clipList)
        let result = [];
        for (const i in clipList) {
            result.push(<Clip data={clipList[i]} clipWidth={clipWidth}/>)
        }
        return result;
    }

    return (

        <div className="board-wrapper-wrapper" style={boardWwStyle}>
            <div className="board-wrapper" style={boardWStyle}>
                <div className="board" style={boardStyle}>
                    {/*<Category/>*/}
                    {buildClips()}
                </div>
            </div>
        </div>

    );
}

function parseUrlParam(search) {
    let obj = {}
    let reg = /[?&][^?&]+=[^?&]+/g
    let arr = search.match(reg)
    if (arr) {
        arr.forEach((item) => {
            let tempArr = item.substring(1).split('=')
            let key = decodeURIComponent(tempArr[0])
            let val = decodeURIComponent(tempArr[1])
            obj[key] = val
        })
    }
    return obj
}

export default Board;