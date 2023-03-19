import { configureStore } from '@reduxjs/toolkit'
import clipboard from './clipboard.js'

const store =  configureStore({
    reducer: {
        clipboard,
    },
})

export default store;