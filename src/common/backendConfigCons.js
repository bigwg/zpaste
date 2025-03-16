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

const SETTINGS_MESSAGE_CHANNEL = {
    // 前端通知后端
    GET_SETTINGS: 'get-settings',
    SAVE_SETTINGS: 'save-settings',
    RESET_SETTINGS: 'reset-settings',
    GET_SYSTEM_INFO: 'get-system-info',
    OPEN_EXTERNAL_LINK: 'open-external-link',
};

module.exports = {
    CLIP_CATEGORY_TYPE,
    CLIP_MESSAGE_CHANNEL,
    SETTINGS_MESSAGE_CHANNEL
};