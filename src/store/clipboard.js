import {createSlice} from '@reduxjs/toolkit'

// 使用createSlice方法创建一个slice。每一个slice里面包含了reducer和actions，实现模块化的封装
export const clipboardSlice = createSlice({
    // 命名空间
    name: 'clipboard',
    // state数据的初始值
    initialState: {
        selectClip: null,
        clipList: [],
        page: {
            pageNum: 1,
            pageSize: 20,
            hasMore: true
        },
        
    },
    // 定义的action。由于内置了immutable插件，可以直接使用赋值的方式进行数据的改变
    reducers: {
        // 更新board信息
        updateBoard: (state, action) => {
            state.selectClip = action.payload.selectClip;
            state.clipList = action.payload.clipList;
            state.page = action.payload.page;
        },
    },
})

export const {updateBoard} = clipboardSlice.actions

export default clipboardSlice.reducer