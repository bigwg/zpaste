const Datastore = require('nedb');
const path = require('path');
const {app} = require('electron');

const clipboardDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/zpasteData.db'),
    autoload: true,
    onload(error) {
        if (error !== null) {
            console.log('data load error:', error)
        }
    }
});

/**
 * 新增剪贴板
 * @param doc
 * @param callback
 */
function addClip(doc, callback) {
    clipboardDb.insert(doc, function (err, newDoc) {
        callback(newDoc)
    });
}

/**
 * 分页查询剪贴板
 * @param text
 * @param pageNum
 * @param pageSize
 * @param callback
 */
function pageQueryClips(text, pageNum, pageSize, callback) {
    let skipCount = (pageNum - 1) * pageSize;
    clipboardDb.find({}).sort({_id: -1}).skip(skipCount).limit(pageSize).exec(function (err, docs) {
        callback(docs)
    });
}

module.exports = {addClip, pageQueryClips};
