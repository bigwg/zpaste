import React, {useEffect} from 'react';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {addClip, initClip} from "../../store/clipboard.js";

function Board(props) {

    // const { mainBoard } = props.location;
    const mainBoard = getQueryString(props.location.search, "mainBoard");

    const dispatch = useDispatch()
    // 使用state中的数据
    const sortList = useSelector((state) => state.clipboard.sortList)

    useEffect(() => {
        console.log(mainBoard)

        if (mainBoard === "true"){
            // 新增剪贴板
            window.electronAPI.addClip((_event, value) => {
                console.log('新增复制内容：', value)
                dispatch(addClip(value))
            });
            // 初始化剪贴板
            window.electronAPI.initClip((_event, value) => {
                console.log('初始化剪贴板内容：', value)
                dispatch(initClip(value))
            });
        }
    },[])

    const buildBoardWidth = () => {
        let boardWidth = (sortList.length + 1) * 350;
        return boardWidth + 20;
    }

    const boardStyle = {
        width: buildBoardWidth()
    }

    const buildClips = () => {
        console.log(sortList)
        let result = [];
        for (const i in sortList) {
            result.push(<Clip data={sortList[i]}/>)
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