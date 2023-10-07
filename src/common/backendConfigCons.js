const CLIP_CATEGORY_TYPE = {
    TEXT: {type: 1, name: '文本'},
    HTML_TEXT: {type: 2, name: '文本'},
    IMAGE: {type: 3, name: '图片'}
};

const CLIP_MESSAGE_CHANNEL = {
    // 前端通知后端
    SELECT_CLIP: 'select_clip',
    PAGE_QUERY_CLIP: 'page_query_clip',
    // 后端通知前端
    UPDATE_PAGE_QUERY: 'update_page_query',
    APPEND_CLIPS: 'append_clips',
    ADD_CLIP: 'add_clip',
    REMOVE_CLIP: 'remove_clip',
};

module.exports = {
    CLIP_CATEGORY_TYPE,
    CLIP_MESSAGE_CHANNEL
}