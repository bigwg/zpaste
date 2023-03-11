import React from 'react';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";

function Board(props) {
    return (
        <>
            <Category/>
            <Clip/>
        </>
    );
}

export default Board;