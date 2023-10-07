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
 * @returns {Promise<unknown>}
 */
async function insertClip(doc) {
    return new Promise((resolve, reject) => {
        clipboardDb.insert(doc, function (err, newDoc) {
            if (err === null) {
                resolve(newDoc);
            } else {
                reject(err);
            }
        });
    })
}

/**
 * 根据id删除数据
 * @param id
 */
function deleteClip(id) {
    clipboardDb.remove({_id: id});
}

/**
 * 分页查询剪贴板
 * @param text
 * @param pageNum
 * @param pageSize
 * @returns {Promise<unknown>}
 */
async function pageQueryClips(text, pageNum, pageSize) {
    return new Promise((resolve, reject) => {
        let skipCount = (pageNum - 1) * pageSize;
        clipboardDb.find({}).sort({copyTime: -1}).skip(skipCount).limit(pageSize).exec(function (err, docs) {
            if (err === null) {
                resolve(docs);
            } else {
                reject(err);
            }
        });
    })
}

/**
 * 分页查询剪贴板数据量
 * @param text
 * @returns {Promise<unknown>}
 */
async function countClips(text) {
    return new Promise((resolve, reject) => {
        clipboardDb.count({}, function (err, count) {
            if (err === null) {
                resolve(count);
            } else {
                reject(err);
            }
        });
    })
}

/**
 * 删除全部文档
 * @returns {Promise<unknown>}
 */
async function deleteAll() {
    return new Promise((resolve, reject) => {
        clipboardDb.remove({}, {multi: true}, function (err, numRemoved) {
            if (err === null) {
                resolve(numRemoved);
            } else {
                reject(err);
            }
        });
    })
}

module.exports = {
    insertClip,
    deleteClip,
    countClips,
    pageQueryClips,
    deleteAll
};
