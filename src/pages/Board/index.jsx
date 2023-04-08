import React, {useEffect} from 'react';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {addClip, initClip, removeClip} from "../../store/clipboard.js";

function Board(props) {

    // const { mainBoard } = props.location;
    const mainBoard = getQueryString(props.location.search, "mainBoard");

    const dispatch = useDispatch()
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList)

    useEffect(() => {
        console.log(mainBoard)

        if (mainBoard === "true"){
            console.log("mainBoard初始化");
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
        }
    },[])

    const buildBoardWidth = () => {
        let boardWidth = (clipList.length + 1) * 350;
        return boardWidth + 20;
    }

    const boardStyle = {
        width: buildBoardWidth()
    }

    const buildClips = () => {
        console.log(clipList)
        let result = [];
        for (const i in clipList) {
            result.push(<Clip data={clipList[i]}/>)
        }
        return result;
    }

    return (

        <div className="board-wrapper-wrapper">
            <div className="board-wrapper">
                <div className="board" style={boardStyle}>
                    {/*<Category/>*/}
                    {buildClips()}
                </div>
            </div>
        </div>

    );
}

function getQueryString(search, name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
    let context = "";
    if (r != null){
        context = decodeURIComponent(r[2]);
    }
    return context == null || context == "" || context == "undefined" ? "" : context;
}

export default Board;