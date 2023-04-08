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
function insertClip(doc, callback) {
    clipboardDb.insert(doc, function (err, newDoc) {
        callback(newDoc);
    });
}

/**
 * 根据id删除数据
 * @param id
 */
function deleteClip(id){
    clipboardDb.remove({_id: id});
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
    clipboardDb.find({}).sort({copyTime: -1}).skip(skipCount).limit(pageSize).exec(function (err, docs) {
        callback(docs);
    });
}

function deleteAll(){
    clipboardDb.remove({}, { multi: true }, function (err, numRemoved) {
    });
}

module.exports = {
    insertClip,
    deleteClip,
    pageQueryClips,
    deleteAll
};
