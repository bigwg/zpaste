import React, {useEffect, useRef, useState, useMemo} from 'react';
import {useDebounceFn, useRequest} from 'ahooks';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {updateBoard} from "../../store/clipboard.js";

function Board(props) {
    const {width, height, displayId} = parseUrlParam(props.location.search);
    const clipWidth = Math.floor(height * 7 / 8);

    const dispatch = useDispatch();
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList);
    const pageNum = useSelector((state) => state.clipboard.page.pageNum);
    const hasMore = useSelector((state) => state.clipboard.page.hasMore);

    const [started, setStarted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const {run: load, loading} = useRequest(
        async () => {
            const data = await window.electronAPI.pageQueryClip({
                pageNum: pageNum + 1,
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
            const elem = containerRef.current
            if (elem == null) return
            const domRect = elem.getBoundingClientRect()
            if (domRect == null) return
            const {right} = domRect
            // 出现在视图内
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
        window.electronAPI.updateBoard((_event, data) => {
            dispatch(updateBoard(data))
        });
        // 初始化页面数据
        window.electronAPI.initBoard(displayId);
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

    const filteredClips = useMemo(() => {
        if (!searchTerm.trim()) return clipList;
        return clipList.filter(clip => 
            clip.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clip.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clipList, searchTerm]);

    const LoadMoreContent = useMemo(() => {
        if (started || loading) return <span className="loading">加载中...</span>
        if (!hasMore) return <span>没有更多内容</span>
        return <span>滑动加载更多</span>
    }, [started, loading, hasMore])

    const buildClips = () => {
        let result = [];
        for (const i in filteredClips) {
            result.push(<Clip key={filteredClips[i].clipId} data={filteredClips[i]} clipWidth={clipWidth}/>)
        }
        return result;
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    }

    return (
        <div className="board-wrapper" style={boardWrapper}>
            <div className="board-header">
                <div className="search-container">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="搜索剪贴板内容..." 
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                    {searchTerm && (
                        <button 
                            className="clear-search" 
                            onClick={() => setSearchTerm('')}
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>
            <div className="board-list" style={boardList} ref={boardListRef}>
                {filteredClips.length > 0 ? (
                    <>
                        {buildClips()}
                        <div className="load" style={loadStyle} ref={containerRef}>
                            {LoadMoreContent}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>没有找到匹配的剪贴板内容</p>
                    </div>
                )}
            </div>
        </div>
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