import {Col, Row} from 'antd';
import React from 'react';
import './style.css'

const cols = [];
const colCount = 2;

for (let i = 0; i < colCount; i++) {
    cols.push(
        <Col key={i.toString()} span={24 / colCount}>
            <div>Column</div>
        </Col>,
    );
}

const Board = () => {
    return (
        <>
            <div>
                这是Board页面
            </div>
            <Row gutter={[8, 8]}>
                {cols}
                {cols}
            </Row>
        </>
    );
};

export default Board;