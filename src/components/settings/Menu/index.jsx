import React from 'react';

const menus = ['通用', '快捷键', '高级', '关于']

const menusHtml = [];

menus.forEach(menu => menusHtml.push(
    <div>menu</div>
))


class Menu extends React.PureComponent {

    handClick = () => {
        console.log('this is:', this);
    }

    render() {
        return (
            <div>
                {menusHtml}
            </div>
        );
    }
}

export default Menu;