import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { changeVal } from '../../../store/clipboard'
import './style.scss';

function Clip (props) {
    const dispatch = useDispatch()
    // 使用state中的数据
    const sortList = useSelector((state) => state.clipboard.sortList)

    useEffect(() => {
        // 触发store中action以更新数据
        dispatch(changeVal([{ label: '家具类', value: '家具类' }]))
    }, [])

    return (
        <div>
            渲染数据：
            <ul>
                {
                    sortList.map(el => (
                        <li key={el.value}>{el.label}</li>
                    ))
                }
            </ul>
        </div>
    )
}

export default Clip