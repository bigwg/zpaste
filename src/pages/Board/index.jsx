import React, {useEffect, useRef, useState, useMemo} from 'react';
import {useDebounceFn, useRequest} from 'ahooks';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {updateBoard} from "../../store/clipboard.js";

function Board(props) {

    const {width, height, displayId} = parseUrlParam(props.location.search);
    
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
    const [actualHeaderHeight, setActualHeaderHeight] = useState(0);

    // 全面的尺寸计算系统 - 基于props的width和height
    const sizeCalculations = useMemo(() => {
        // 基础尺寸比例系数
        const baseWidth = 1200; // 基准宽度
        const baseHeight = 800; // 基准高度
        const widthRatio = width / baseWidth;
        const heightRatio = height / baseHeight;
        const avgRatio = (widthRatio + heightRatio) / 2;
        
        // 头部尺寸计算
        const headerPadding = {
            top: Math.max(16, Math.round(20 * heightRatio)),
            bottom: Math.max(16, Math.round(20 * heightRatio)),
            left: Math.max(20, Math.round(24 * widthRatio)),
            right: Math.max(20, Math.round(24 * widthRatio))
        };
        
        // 搜索框尺寸计算
        const searchBox = {
            width: Math.min(width * 0.4, Math.max(200, Math.round(240 * widthRatio))),
            height: Math.max(28, Math.round(32 * avgRatio)),
            borderRadius: Math.max(12, Math.round(16 * avgRatio)),
            fontSize: Math.max(11, Math.round(13 * avgRatio)),
            iconSize: Math.max(12, Math.round(14 * avgRatio))
        };
        
        // 估算头部总高度
        const estimatedHeaderHeight = headerPadding.top + headerPadding.bottom + searchBox.height + 2; // +2 for border
        const actualUsedHeaderHeight = actualHeaderHeight || estimatedHeaderHeight;
        
        // 列表区域尺寸计算
        const boardListPadding = {
            top: Math.max(8, Math.round(12 * heightRatio)),
            bottom: Math.max(20, Math.round(24 * heightRatio)),
            left: Math.max(8, Math.round(10 * widthRatio)),
            right: Math.max(8, Math.round(10 * widthRatio))
        };
        
        const boardListTotalPadding = boardListPadding.top + boardListPadding.bottom;
        
        // 可用于显示clip的高度 - 增加额外高度来遮挡底部横条
        const extraHeight = 20; // 额外增加20px高度来遮挡底部横条
        const availableHeight = height - actualUsedHeaderHeight - boardListTotalPadding + extraHeight;
        
        // clip尺寸：使用可用高度的88%，适当缩小并确保不会被遮挡
        const clipWidth = Math.floor(availableHeight * 0.88);
        const clipGap = Math.max(8, Math.round(10 * widthRatio));
        
        // 加载更多元素尺寸
        const loadMore = {
            width: Math.max(100, Math.round(120 * widthRatio)),
            height: clipWidth,
            fontSize: Math.max(12, Math.round(14 * avgRatio)),
            borderRadius: Math.max(12, Math.round(16 * avgRatio))
        };
        
        // 空状态尺寸
        const emptyState = {
            iconSize: Math.max(48, Math.round(72 * avgRatio)),
            titleSize: Math.max(16, Math.round(20 * avgRatio)),
            subtitleSize: Math.max(14, Math.round(16 * avgRatio)),
            spacing: Math.max(20, Math.round(28 * avgRatio))
        };
        
        // 清空按钮尺寸
        const clearBtn = {
            size: Math.max(16, Math.round(20 * avgRatio)),
            fontSize: Math.max(8, Math.round(10 * avgRatio))
        };
        
        // 添加调试信息
        console.log('Board全面尺寸计算:', {
            windowSize: { width, height },
            ratios: { widthRatio, heightRatio, avgRatio },
            headerPadding,
            searchBox,
            estimatedHeaderHeight,
            actualUsedHeaderHeight,
            boardListPadding,
            availableHeight,
            clipWidth,
            loadMore,
            emptyState
        });
        
        return {
            // 基础比例
            widthRatio,
            heightRatio,
            avgRatio,
            
            // 头部相关
            headerPadding,
            searchBox,
            clearBtn,
            estimatedHeaderHeight,
            actualUsedHeaderHeight,
            
            // 列表相关
            boardListPadding,
            availableHeight,
            clipWidth,
            clipGap,
            
            // 其他元素
            loadMore,
            emptyState
        };
    }, [width, height, actualHeaderHeight]);

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
    }, [actualHeaderHeight, sizeCalculations.searchBox.height]);

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

    // 动态样式对象
    const dynamicStyles = {
        boardWrapper: {
            height: `${height}px`,
            width: `${width}px`,
            borderRadius: `${Math.max(16, Math.round(20 * sizeCalculations.avgRatio))}px`,
            fontSize: `${Math.max(12, Math.round(14 * sizeCalculations.avgRatio))}px`
        },
        
        boardHeader: {
            padding: `${sizeCalculations.headerPadding.top}px ${sizeCalculations.headerPadding.right}px ${sizeCalculations.headerPadding.bottom}px ${sizeCalculations.headerPadding.left}px`
        },
        
        searchBox: {
            width: `${sizeCalculations.searchBox.width}px`,
            height: `${sizeCalculations.searchBox.height}px`,
            borderRadius: `${sizeCalculations.searchBox.borderRadius}px`,
            fontSize: `${sizeCalculations.searchBox.fontSize}px`
        },
        
        searchIcon: {
            fontSize: `${sizeCalculations.searchBox.iconSize}px`,
            marginLeft: `${Math.max(8, Math.round(12 * sizeCalculations.widthRatio))}px`,
            marginRight: `${Math.max(6, Math.round(8 * sizeCalculations.widthRatio))}px`
        },
        
        clearBtn: {
            width: `${sizeCalculations.clearBtn.size}px`,
            height: `${sizeCalculations.clearBtn.size}px`,
            fontSize: `${sizeCalculations.clearBtn.fontSize}px`,
            marginRight: `${Math.max(6, Math.round(8 * sizeCalculations.widthRatio))}px`
        },
        
        boardList: {
            height: `${sizeCalculations.availableHeight}px`,
            width: `${width}px`,
            padding: `${sizeCalculations.boardListPadding.top}px ${sizeCalculations.boardListPadding.right}px ${sizeCalculations.boardListPadding.bottom}px ${sizeCalculations.boardListPadding.left}px`,
            gap: `${sizeCalculations.clipGap}px`
        },
        
        loadMore: {
            width: `${sizeCalculations.loadMore.width}px`,
            height: `${sizeCalculations.loadMore.height}px`,
            fontSize: `${sizeCalculations.loadMore.fontSize}px`,
            borderRadius: `${sizeCalculations.loadMore.borderRadius}px`
        },
        
        emptyState: {
            fontSize: `${sizeCalculations.emptyState.subtitleSize}px`
        },
        
        emptyIcon: {
            fontSize: `${sizeCalculations.emptyState.iconSize}px`,
            marginBottom: `${sizeCalculations.emptyState.spacing}px`
        },
        
        emptyTitle: {
            fontSize: `${sizeCalculations.emptyState.titleSize}px`,
            marginBottom: `${Math.max(6, Math.round(8 * sizeCalculations.avgRatio))}px`
        },
        
        emptySubtitle: {
            fontSize: `${sizeCalculations.emptyState.subtitleSize}px`,
            lineHeight: Math.max(1.3, 1.4 * sizeCalculations.avgRatio)
        }
    };

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
                    <Clip data={clip} clipWidth={sizeCalculations.clipWidth}/>
                </div>
            );
        }).filter(Boolean); // 过滤掉null值
    }, [searchText, filteredClips, clipList, sizeCalculations.clipWidth]);

    const renderEmptyState = () => {
        if (searchText && filteredClips.length === 0) {
            return (
                <div className="empty-state" style={dynamicStyles.emptyState}>
                    <div className="empty-icon" style={dynamicStyles.emptyIcon}>🔍</div>
                    <div className="empty-title" style={dynamicStyles.emptyTitle}>未找到匹配项</div>
                    <div className="empty-subtitle" style={dynamicStyles.emptySubtitle}>
                        尝试使用不同的关键词搜索
                    </div>
                </div>
            );
        }
        
        if (!searchText && clipList.length === 0) {
            return (
                <div className="empty-state" style={dynamicStyles.emptyState}>
                    <div className="empty-icon" style={dynamicStyles.emptyIcon}>📋</div>
                    <div className="empty-title" style={dynamicStyles.emptyTitle}>暂无剪贴板历史</div>
                    <div className="empty-subtitle" style={dynamicStyles.emptySubtitle}>
                        复制内容后将会显示在这里<br/>
                        使用 ⌘+C 复制内容开始使用
                    </div>
                </div>
            );
        }
        
        return null;
    };

    return (
        <div className="board-wrapper" style={dynamicStyles.boardWrapper}>
            <div className="board-header" style={dynamicStyles.boardHeader} ref={headerRef}>
                <div className="search-wrapper">
                    <div className="search-box" style={dynamicStyles.searchBox}>
                        <span className="search-icon" style={dynamicStyles.searchIcon}>🔍</span>
                        <input
                            ref={searchInputRef}
                            className="search-input"
                            type="text"
                            placeholder="搜索..."
                            value={searchText}
                            onChange={handleSearchChange}
                            style={{ fontSize: dynamicStyles.searchBox.fontSize }}
                        />
                        {searchText && (
                            <button 
                                className="clear-btn" 
                                onClick={clearSearch}
                                style={dynamicStyles.clearBtn}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="board-list" style={dynamicStyles.boardList} ref={boardListRef}>
                {renderEmptyState() || (
                    <>
                        {buildClips}
                        {LoadMoreContent && (
                            <div className="load" style={dynamicStyles.loadMore} ref={containerRef}>
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