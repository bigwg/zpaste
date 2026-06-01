import React, {useEffect, useRef, useState, useMemo, useCallback} from 'react';
import {useDebounceFn, useRequest} from 'ahooks';
import './style.scss';
import Category from "../../components/board/Category";
import Clip from "../../components/board/Clip";
import {useDispatch, useSelector} from "react-redux";
import {updateBoard} from "../../store/clipboard.js";
import {t, initLocale} from '../../i18n';

function Board(props) {

    const {width, height, displayId} = parseUrlParam(props.location.search);
    const clipWidth = Math.floor(height * 7 / 8);

    const dispatch = useDispatch();
    // 使用state中的数据
    const clipList = useSelector((state) => state.clipboard.clipList);
    const pageNum = useSelector((state) => state.clipboard.page.pageNum);
    const hasMore = useSelector((state) => state.clipboard.page.hasMore);

    const [started, setStarted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // 初始化语言设置
    useEffect(() => {
        initLocale();
    }, []);

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
    const clipRefs = useRef([])

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
        // let info = "boardWindow初始化：width=" + width + ", height=" + height + ", clipWidth=" + clipWidth;
        window.electronAPI.updateBoard((_event, data) => {
            console.log('updateBoard：', data)
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

    // 键盘事件处理：左右键选择clip，回车粘贴
    const handleKeyDown = useCallback((e) => {
        if (clipList.length === 0) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                setSelectedIndex(prev => {
                    const newIndex = prev <= 0 ? clipList.length - 1 : prev - 1;
                    scrollToClip(newIndex);
                    return newIndex;
                });
                break;
            case 'ArrowRight':
                e.preventDefault();
                setSelectedIndex(prev => {
                    const newIndex = prev >= clipList.length - 1 ? 0 : prev + 1;
                    scrollToClip(newIndex);
                    return newIndex;
                });
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < clipList.length) {
                    const selectedClip = clipList[selectedIndex];
                    window.electronAPI.pasteClip(selectedClip);
                }
                break;
            default:
                break;
        }
    }, [clipList, selectedIndex]);

    // 注册键盘事件
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // 滚动到指定clip
    const scrollToClip = (index) => {
        if (clipRefs.current[index]) {
            clipRefs.current[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    };

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
        if (started || loading) return <span>{t('clipboard.loading')}</span>
        if (!hasMore) return <span>{t('clipboard.noMore')}</span>
        return <span>{t('clipboard.loadMore')}</span>
    }, [started, loading, hasMore])

    const buildClips = () => {
        let result = [];
        for (const i in clipList) {
            const index = parseInt(i);
            result.push(
                <Clip
                    key={clipList[i].clipId}
                    ref={el => clipRefs.current[index] = el}
                    data={clipList[i]}
                    clipWidth={clipWidth}
                    selected={index === selectedIndex}
                />
            )
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
