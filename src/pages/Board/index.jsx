import React, {useEffect, useRef, useState, useMemo} from 'react';
import {useDebounceFn, useRequest} from 'ahooks';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {updateBoard} from "../../store/clipboard.js";

function Board(props) {

    const {width, height, displayId} = parseUrlParam(props.location.search);
    
    // 重新精确计算头部高度：
    // - 头部padding: 20px(top) + 20px(bottom) = 40px
    // - 搜索框高度: 32px (新的一体化搜索框)
    // - 边框: 1px
    // 总计约: 40 + 32 + 1 = 73px (使用新的搜索框设计)
    const estimatedHeaderHeight = 73;
    // board-list的padding: 12px(top) + 16px(bottom) = 28px
    const boardListPadding = 28;

    const dispatch = useDispatch();
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList);
    const pageNum = useSelector((state) => state.clipboard.page.pageNum);
    const hasMore = useSelector((state) => state.clipboard.page.hasMore);

    const [started, setStarted] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filteredClips, setFilteredClips] = useState([]);

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
    const searchInputRef = useRef(null)
    const headerRef = useRef(null)
    
    // 动态计算头部高度的状态
    const [actualHeaderHeight, setActualHeaderHeight] = useState(estimatedHeaderHeight);

    // 动态计算尺寸
    const sizeCalculations = useMemo(() => {
        // 可用于显示clip的高度 - 使用动态测量的头部高度
        const actualAvailableHeight = height - actualHeaderHeight - boardListPadding;
        // clip尺寸：使用可用高度的95%，确保不会被遮挡
        const actualClipWidth = Math.floor(actualAvailableHeight * 0.95);
        
        // 添加调试信息
        console.log('Board尺寸计算:', {
            windowHeight: height,
            estimatedHeaderHeight,
            actualHeaderHeight,
            boardListPadding,
            actualAvailableHeight,
            actualClipWidth
        });
        
        return {
            actualAvailableHeight,
            actualClipWidth
        };
    }, [height, actualHeaderHeight, boardListPadding, estimatedHeaderHeight]);

    // 搜索功能
    const {run: handleSearch} = useDebounceFn(
        (value) => {
            if (!value.trim()) {
                setFilteredClips(clipList);
                return;
            }
            
            const filtered = clipList.filter(clip => 
                clip.content?.toLowerCase().includes(value.toLowerCase()) ||
                clip.category?.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredClips(filtered);
        },
        {
            wait: 300,
        }
    );

    const {run: tryLoadMore} = useDebounceFn(
        () => {
            const elem = containerRef.current
            if (elem == null) return
            const domRect = elem.getBoundingClientRect()
            if (domRect == null) return
            const {right} = domRect
            
            if (right <= document.body.clientWidth && !loading) { // 避免重复加载
                load()
                setStarted(true)
            }
        },
        {
            wait: 300, // 从500ms减少到300ms，提高响应性
        }
    )

    useEffect(() => {
        window.electronAPI.updateBoard((_event, data) => {
            console.log('updateBoard：', data)
            dispatch(updateBoard(data))
        });
        
        // 初始化页面数据
        window.electronAPI.initBoard(displayId);
        
        // 添加快捷键支持
        const handleKeyDown = (e) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'f') {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }
            }
            if (e.key === 'Escape') {
                setSearchText('');
                searchInputRef.current?.blur();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [])

    // 动态测量头部高度
    useEffect(() => {
        if (headerRef.current) {
            const measuredHeight = headerRef.current.offsetHeight;
            if (measuredHeight !== actualHeaderHeight) {
                setActualHeaderHeight(measuredHeight);
                console.log('动态测量头部高度:', measuredHeight);
            }
        }
    }, [actualHeaderHeight]);

    // 更新过滤后的剪贴板列表
    useEffect(() => {
        if (!searchText.trim()) {
            setFilteredClips(clipList);
        } else {
            handleSearch(searchText);
        }
    }, [clipList, searchText, handleSearch]);

    // 当页面滚动时，触发加载
    useEffect(() => {
        if (hasMore && !searchText) {
            const boardListEle = boardListRef.current
            if (boardListEle) {
                // 使用 passive 选项优化滚动性能
                boardListEle.addEventListener('scroll', tryLoadMore, { passive: true })
                return () => boardListEle.removeEventListener('scroll', tryLoadMore)
            }
        }
    }, [hasMore, searchText, tryLoadMore])

    const boardWrapper = {
        height: `${height}px`,
        width: `${width}px`
    }

    const boardList = {
        height: `${sizeCalculations.actualAvailableHeight}px`, // 使用动态计算的可用高度
        width: `${width}px`
    }

    const loadStyle = {
        height: `${sizeCalculations.actualClipWidth}px`,
        width: `100px`
    }

    const LoadMoreContent = useMemo(() => {
        if (searchText) return null;
        if (started || loading) return <span>加载中...</span>
        if (!hasMore) return <span>没有更多了</span>
        return <span>滑动加载更多</span>
    }, [started, loading, hasMore, searchText])

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const clearSearch = () => {
        setSearchText('');
        searchInputRef.current?.focus();
    };

    const buildClips = useMemo(() => {
        const clips = searchText ? filteredClips : clipList;
        // 添加错误边界保护，防止单个clip出错影响整个列表
        return clips.map((clip, index) => {
            // 确保clip数据完整性
            if (!clip || !clip.clipId) {
                console.warn('Invalid clip data:', clip, 'at index:', index);
                return null;
            }
            
            return (
                <div key={clip.clipId} className="fade-in">
                    <Clip data={clip} clipWidth={sizeCalculations.actualClipWidth}/>
                </div>
            );
        }).filter(Boolean); // 过滤掉null值
    }, [searchText, filteredClips, clipList, sizeCalculations.actualClipWidth]);

    const renderEmptyState = () => {
        if (searchText && filteredClips.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">未找到匹配项</div>
                    <div className="empty-subtitle">
                        尝试使用不同的关键词搜索
                    </div>
                </div>
            );
        }
        
        if (!searchText && clipList.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">暂无剪贴板历史</div>
                    <div className="empty-subtitle">
                        复制内容后将会显示在这里<br/>
                        使用 ⌘+C 复制内容开始使用
                    </div>
                </div>
            );
        }
        
        return null;
    };

    // 移除了统计信息显示，改为简洁的按钮布局

    return (
        <div className="board-wrapper" style={boardWrapper}>
            <div className="board-header" ref={headerRef}>
                <div className="search-wrapper">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            ref={searchInputRef}
                            className="search-input"
                            type="text"
                            placeholder="搜索..."
                            value={searchText}
                            onChange={handleSearchChange}
                        />
                        {searchText && (
                            <button className="clear-btn" onClick={clearSearch}>
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="board-list" style={boardList} ref={boardListRef}>
                {renderEmptyState() || (
                    <>
                        {buildClips}
                        {LoadMoreContent && (
                            <div className="load" style={loadStyle} ref={containerRef}>
                                {LoadMoreContent}
                            </div>
                        )}
                    </>
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