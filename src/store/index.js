import { configureStore } from '@reduxjs/toolkit'
import clipboard from './clipboard'

export default configureStore({
    reducer: {
        clipboard,
    },
})