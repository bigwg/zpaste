import React, {useEffect} from 'react';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {addClip} from "../../store/clipboard.js";

function Board(props) {

    // 触发store中action以更新数据
    window.electronAPI.onUpdateCounter((_event, value) => {
        console.log('新增复制内容：', value)
        dispatch(addClip(value))
    })

    const dispatch = useDispatch()
    // 使用state中的数据
    const sortList = useSelector((state) => state.clipboard.sortList)

    useEffect(() => {

    })

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

export default Board;