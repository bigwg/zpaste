import React from 'react';
import './style.scss'
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";


class Board extends React.PureComponent {

    state = {title: "默认title"}

    handClick = () => {
        this.setState({title: "修改后的title"})
    }

    render() {
        return (
            <>
                <Category/>
                <Clip/>
            </>
        );
    }
};

export default Board;