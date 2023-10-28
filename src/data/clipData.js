const Datastore = require('nedb');
const path = require('path');
const {app} = require('electron');
const AwaitLock = require('await-lock');
const lock = new AwaitLock();

const clipDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/zpasteClip.db'),
    autoload: true,
    onload(error) {
        if (error !== null) {
            console.log('data load error:', error)
        }
    }
});

const boardDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/zpasteBoard.db'),
    autoload: true,
    onload(error) {
        if (error !== null) {
            getBoard();
        }
    }
});

const initBoardData = {
    clipList: [],
    page: {
        pageNum: 1,
        pageSize: 20,
        hasMore: true
    }
}

let boardData = null;

/**
 * 获取最新board
 * @returns {null}
 */
async function getBoard() {
    if (boardData !== null) {
        return boardData;
    } else {
        // 初始化
        await lock.acquireAsync();
        try {
            return await initBoard();
        } finally {
            lock.release();
        }
    }
}

/**
 * 新增剪贴板
 * @param doc
 * @returns {Promise<unknown>}
 */
async function insertClip(doc) {
    // 1、新增到db
    let insertDoc = await new Promise((resolve, reject) => {
        clipDb.insert(doc, function (err, newDoc) {
            if (err === null) {
                let resultDoc = {...newDoc, clipId: newDoc._id};
                resolve(resultDoc);
            } else {
                reject(err);
            }
        });
    })
    // 2、新增到board
    let board = await getBoard();
    board.clipList.unshift(insertDoc);
    await updateBoard({...board});
}

/**
 * 根据id删除数据
 * @param id
 * @return numRemoved
 */
async function deleteClip(id) {
    // 1、删除db中的数据
    let deletedNum = await new Promise((resolve, reject) => {
        clipDb.remove({_id: id}, function (err, numRemoved) {
            if (err === null) {
                resolve(numRemoved);
            } else {
                reject(err);
            }
        })
    });
    // 2、更新board
    let board = await getBoard();
    let newClipList = board.clipList.filter(item => item.id !== id);
    await updateBoard({...board, clipList: newClipList});
}

/**
 * 分页查询剪贴板
 * @param text
 * @param pageNum
 * @param pageSize
 * @returns {Promise<unknown>}
 */
async function pageQueryClips(text, pageNum, pageSize) {
    // 1、查询db中的数据
    let queryResults = await new Promise((resolve, reject) => {
        let skipCount = (pageNum - 1) * pageSize;
        clipDb.find({}).sort({copyTime: -1}).skip(skipCount).limit(pageSize).exec(function (err, docs) {
            if (err === null) {
                let result = [];
                docs.forEach(doc => {
                    result.push({...doc, clipId: doc._id})
                })
                resolve(result);
            } else {
                reject(err);
            }
        });
    })
    // 2、更新board
    let hasMore = true;
    if (queryResults.length < pageSize) {
        hasMore = false;
    }
    let board = await getBoard();
    let pageData = {pageSize: board.page.pageSize, pageNum: board.page.pageNum + 1, hasMore: hasMore};
    let boardList = board.clipList;
    boardList.push(queryResults);
    await updateBoard({page: pageData, clipList: boardList});
}

/**
 * 查询剪贴板总数
 * @param text
 * @returns numberCount
 */
async function countClips(text) {
    return new Promise((resolve, reject) => {
        clipDb.count({}, function (err, count) {
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
 * @returns numRemoved
 */
async function deleteAll() {
    return new Promise((resolve, reject) => {
        clipDb.remove({}, {multi: true}, function (err, numRemoved) {
            if (err === null) {
                resolve(numRemoved);
            } else {
                reject(err);
            }
        });
    })
}

/**
 * 更新board
 * @param data
 * @return numReplaced
 */
async function updateBoard(data) {
    boardData = data;
    return new Promise((resolve, reject) => {
        boardDb.update({system: 'board'}, {system: 'board', data: data}, {}, function (err, numReplaced) {
            if (err === null) {
                resolve(numReplaced);
            } else {
                reject(err);
            }
        });
    })
}

/**
 * 初始化剪贴板数据
 */
async function initBoard() {
    if (boardData !== null) {
        return boardData;
    }
    boardData = await new Promise((resolve, reject) => {
        boardDb.findOne({system: 'board'}, function (err, doc) {
            if (err === null) {
                resolve(doc.data);
            } else {
                reject(err);
            }
        });
    });
    if (boardData === null || boardData === undefined) {
        let boardList = await pageQueryClips(null, 1, 20);
        boardData = {...initBoardData, clipList: boardList};
    }
    return boardData;
}

module.exports = {
    insertClip,
    deleteClip,
    countClips,
    pageQueryClips,
    deleteAll,
    getBoard
};
