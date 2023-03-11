import React from 'react';
import './style.scss';

const cols = [];
const colCount = 2;

for (let i = 0; i < colCount; i++) {
    cols.push(
        <div>i + 1</div>
    );
}

class Clip extends React.PureComponent {

    handClick = () => {
        console.log('this is:', this);
    }

    render() {
        return (
            <div className="clipPane">
                {cols}
            </div>
        );
    }
};

export default Clip;