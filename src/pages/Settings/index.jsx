import React, {useEffect, useReducer} from 'react';
import './style.scss';
import {useDispatch, useSelector} from "react-redux";
import {addClip, addCount} from "../../store/clipboard";

function Settings() {

    const [state, dispatch] = useReducer(reducer, initialState);
    const { count, step } = state;

    useEffect(() => {
        const id = setInterval(() => {
            dispatch({ type: 'tick' }); // Instead of setCount(c => c + step);
        }, 1000);
        return () => clearInterval(id);
    }, [dispatch]);

    // const dispatch = useDispatch()
    // // 使用state中的数据
    // const count = useSelector((state) => state.clipboard.count)

    useEffect(() => {
        setInterval(() => {
            dispatch(addCount(1))
        }, 1000);
    },[])

    return (
        <div>{count}</div>
    );
}

export default Settings;