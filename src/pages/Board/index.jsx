import React, {useEffect, useRef, useState, useMemo} from 'react';
import {useDebounceFn, useRequest} from 'ahooks';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {addClip, appendClips, removeClip, updatePageQuery} from "../../store/clipboard.js";

function Board(props) {

    const {width, height, displayId} = parseUrlParam(props.location.search);
    const clipWidth = Math.floor(height * 7 / 8);

    const dispatch = useDispatch()
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList)
    const pageNum = useSelector((state) => state.clipboard.page.pageNum);
    const hasMore = useSelector((state) => state.clipboard.page.hasMore);

    const [started, setStarted] = useState(false)

    const {run: load, loading} = useRequest(
        async () => {
            const data = await window.electronAPI.pageQueryClip({
                pageNum,
                pageSize: 20
            })
            return data
        },
        {
            manual: true,
            onSuccess(result) {
                setStarted(false);
            },
        }
    )

    const containerRef = useRef(null)
    const boardListRef = useRef(null)

    const {run: tryLoadMore} = useDebounceFn(
        () => {
            console.log("@@@@@@@@@@@@@@@@@@@@tryLoadMore");
            const elem = containerRef.current
            if (elem == null) return
            const domRect = elem.getBoundingClientRect()
            if (domRect == null) return
            const {right} = domRect
            // 出现在视图内
            console.log("!!!!right:", right);
            console.log("!!!!document.body.clientWidth:", document.body.clientWidth)
            if (right <= document.body.clientWidth) {
                load() // 真正加载数据
                setStarted(true)
            }
        },
        {
            wait: 500,
        }
    )

    useEffect(() => {
        let info = "boardWindow初始化：width=" + width + ", height=" + height + ", clipWidth=" + clipWidth;
        // alert(info)
        // 新增剪贴板
        window.electronAPI.addClip((_event, clip) => {
            console.log('新增复制内容：', clip)
            dispatch(addClip(clip))
        });
        // 初始化剪贴板
        window.electronAPI.appendClips((_event, clips) => {
            console.log('初始化剪贴板内容：', clips)
            dispatch(appendClips(clips))
        });
        // 移除剪贴板内容
        window.electronAPI.removeClip((_event, clipId) => {
            console.log('移除剪贴板内容：', clipId)
            dispatch(removeClip(clipId))
        });
        // 更新pageQuery
        window.electronAPI.updatePageQuery((_event, data) => {
            console.log('更新pageQuery：', data)
            dispatch(updatePageQuery(data))
        });
    }, [])

    // 当页面滚动时，触发加载
    useEffect(() => {
        if (hasMore) {
            const boardListEle = boardListRef.current
            boardListEle.addEventListener('scroll', tryLoadMore)
        }

        return () => {
            const boardListEle = boardListRef.current
            boardListEle.removeEventListener('scroll', tryLoadMore)
        }
    }, [hasMore])

    const boardWrapper = {
        height: `${height}px`,
        width: `${width}px`
    }

    const boardList = {
        height: `${clipWidth + 23}px`,
        width: `${width}px`
    }

    const loadStyle = {
        height: `${clipWidth}px`,
        width: `100px`
    }

    const LoadMoreContent = useMemo(() => {
        if (!started || loading) return <span>加载中...</span>
        if (!hasMore) return <span>没有更多了...</span>
        return <span>开始加载下一页...</span>
    }, [started, loading, hasMore])

    const buildClips = () => {
        // console.log(clipList)
        let result = [];
        for (const i in clipList) {
            result.push(<Clip data={clipList[i]} clipWidth={clipWidth}/>)
        }
        return result;
    }

    return (
        <>
            {/*<Category/>*/}
            <div className="board-wrapper" style={boardWrapper}>
                <div className="board-list" style={boardList} ref={boardListRef}>
                    {buildClips()}
                    <div className="load" style={loadStyle} ref={containerRef}>
                        {LoadMoreContent}
                    </div>
                </div>
            </div>
        </>
    );
}

function parseUrlParam(search) {
    let obj = {}
    let reg = /[?&][^?&]+=[^?&]+/g
    let arr = search.match(reg)
    if (arr) {
        arr.forEach((item) => {
            let tempArr = item.substring(1).split('=')
            let key = decodeURIComponent(tempArr[0])
            let val = decodeURIComponent(tempArr[1])
            obj[key] = val
        })
    }
    return obj
}

export default Board;