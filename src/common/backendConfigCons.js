const CLIP_CATEGORY_TYPE = {
    TEXT: {type: 1, name: '文本'},
    HTML_TEXT: {type: 2, name: '文本'},
    IMAGE: {type: 3, name: '图片'}
};

const CLIP_MESSAGE_CHANNEL = {
    // 前端通知后端
    INIT_BOARD: 'init_board',
    SELECT_CLIP: 'select_clip',
    PASTE_CLIP: 'paste_clip',
    PAGE_QUERY_CLIP: 'page_query_clip',
    // 后端通知前端
    UPDATE_BOARD: 'update_board',
};

module.exports = {
    CLIP_CATEGORY_TYPE,
    CLIP_MESSAGE_CHANNEL
}