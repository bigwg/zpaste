const Datastore = require('nedb');
const path = require('path');
const {app} = require('electron');

const configDb = new Datastore({
    filename: path.join(app.getPath('userData'), '/zpasteConfig.db'),
    autoload: true,
    onload(error) {
        if (error !== null) {
            console.log('data load error:', error)
        }
    }
});

/**
 * 添加配置
 * @param config
 * @returns {Promise<unknown>}
 */
async function addConfig(config) {
    return new Promise((resolve, reject) => {
        configDb.insert(config, function (err, newDoc) {
            if (err === null) {
                resolve(newDoc);
            } else {
                reject(err);
            }
        });
    });
}

/**
 * 获取配置
 * @param key 配置键
 * @returns {Promise<unknown>}
 */
async function getConfig(key) {
    return new Promise((resolve, reject) => {
        configDb.findOne({key: key}, function (err, doc) {
            if (err === null) {
                resolve(doc);
            } else {
                reject(err);
            }
        });
    });
}

/**
 * 更新配置
 * @param key 配置键
 * @param value 配置值
 * @returns {Promise<unknown>}
 */
async function updateConfig(key, value) {
    return new Promise((resolve, reject) => {
        configDb.update({key: key}, {key: key, value: value}, {upsert: true}, function (err, numReplaced, upsert) {
            if (err === null) {
                resolve({numReplaced, upsert});
            } else {
                reject(err);
            }
        });
    });
}

/**
 * 删除配置
 * @param key 配置键
 * @returns {Promise<unknown>}
 */
async function removeConfig(key) {
    return new Promise((resolve, reject) => {
        configDb.remove({key: key}, {}, function (err, numRemoved) {
            if (err === null) {
                resolve(numRemoved);
            } else {
                reject(err);
            }
        });
    });
}

module.exports = {
    addConfig,
    getConfig,
    updateConfig,
    removeConfig
};
