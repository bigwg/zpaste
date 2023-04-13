import {createSlice} from '@reduxjs/toolkit'

// 使用createSlice方法创建一个slice。每一个slice里面包含了reducer和actions，实现模块化的封装
export const clipboardSlice = createSlice({
    // 命名空间
    name: 'clipboard',
    // state数据的初始值
    initialState: {
        clipList: []
    },
    // 定义的action。由于内置了immutable插件，可以直接使用赋值的方式进行数据的改变
    reducers: {
        // 添加剪贴板
        addClip: (state, action) => {
            let add = action.payload;
            console.log("新增剪贴板add：", add)
            let result = state.clipList;
            result.unshift(add)
            console.log("新增剪贴板result：", result)
            state.clipList = result
        },
        // 初始化剪贴板
        initClip: (state, action) => {
            let initClip = action.payload;
            console.log("初始化剪贴板：", initClip)
            state.clipList = initClip;
        },
        // 移除剪贴板
        removeClip: (state, action) => {
            let clipId = action.payload;
            let clipList = state.clipList;
            let newClipList = [];
            for (let clipListKey in clipList) {
                let clipData = clipList[clipListKey];
                if (clipData.clipId === clipId) {
                    continue;
                }
                newClipList.push(clipData);
            }
            state.clipList = newClipList;
        }
    },
})

export const {addClip, initClip, removeClip} = clipboardSlice.actions

export default clipboardSlice.reducer