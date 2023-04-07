import { createSlice } from '@reduxjs/toolkit'

// 使用createSlice方法创建一个slice。每一个slice里面包含了reducer和actions，实现模块化的封装
export const clipboardSlice = createSlice({
  // 命名空间
  name: 'clipboard',
  // state数据的初始值
  initialState: {
    sortList: [
    ]
  },
  // 定义的action。由于内置了immutable插件，可以直接使用赋值的方式进行数据的改变
  reducers: {
    addClip: (state, action) => {
      let add = action.payload;
      let result = state.sortList;
      result.unshift(add)
      state.sortList = result
    },
    initClip: (state, action) => {
      let initClip = action.payload;
      state.sortList = initClip;
    }
  },
})

export const { addClip, initClip } = clipboardSlice.actions

export default clipboardSlice.reducer