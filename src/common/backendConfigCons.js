const CLIP_CATEGORY_TYPE = {
    TEXT: {type: 1, name: '文本'},
    HTML_TEXT: {type: 2, name: '文本'},
    IMAGE: {type: 3, name: '图片'}
};

const CLIP_MESSAGE_CHANNEL = {
    SELECT_CLIP: 'select_clip',
    INIT_CLIP: 'init_clip',
    ADD_CLIP: 'add_clip'
};

module.exports = {
    CLIP_CATEGORY_TYPE,
    CLIP_MESSAGE_CHANNEL
}