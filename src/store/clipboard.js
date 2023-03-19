import { createSlice } from '@reduxjs/toolkit'

// 使用createSlice方法创建一个slice。每一个slice里面包含了reducer和actions，实现模块化的封装
export const clipboardSlice = createSlice({
  // 命名空间
  name: 'clipboard',
  // state数据的初始值
  initialState: {
    sortList: [
      {clipId: 1, category: '文本', copyTime: '3分钟前', appIcon: 1, content: "测试文本1", contentHtml: "测试文本1"},
      {clipId: 2, category: '文本', copyTime: '13分钟前', appIcon: 1, content: "测试文本2", contentHtml: "测试文本2"},
      {clipId: 3, category: '文本', copyTime: '23分钟前', appIcon: 1, content: "测试文本3", contentHtml: "测试文本3"},
      {clipId: 4, category: '文本', copyTime: '33分钟前', appIcon: 1, content: "测试文本4", contentHtml: "测试文本4"},
      {clipId: 5, category: '文本', copyTime: '43分钟前', appIcon: 1, content: "测试文本5", contentHtml: "测试文本5"}
    ]
  },
  // 定义的action。由于内置了immutable插件，可以直接使用赋值的方式进行数据的改变
  reducers: {
    addClip: (state, action) => {
      console.log('addClip:', JSON.parse(JSON.stringify(state)), state, action)
      let add = action.payload;
      let result = state.sortList;
      result.unshift(add)
      state.sortList = result
    }
  },
})

export const { addClip } = clipboardSlice.actions

export default clipboardSlice.reducer