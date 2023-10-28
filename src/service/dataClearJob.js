const schedule = require('node-schedule');

const {getBoardWindows} = require('../service/boardWindowService');

let refreshBoardJob, clearDataJob;

function startDataClearJob() {
    let boardWindows = getBoardWindows();
    // 定时处理剪贴板历史数量，每隔30分钟处理一次，减少页面占用内存
    refreshBoardJob = schedule.scheduleJob('0 0/1 * * * *', function () {
        let now = new Date().toLocaleString();
        console.log("定时处理剪贴板历史数量，每隔30分钟处理一次,", now, ",", JSON.stringify(boardWindows));
    });

    // 定时清理nedb中的历史数据，按照系统保留天数进行清理，默认保留30天
    clearDataJob = schedule.scheduleJob('0 0 8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23 * * *', function () {
        let now = new Date().toLocaleString();
        console.log("定时处理剪贴板历史数量，每隔30分钟处理一次,", now, ",", JSON.stringify(boardWindows));
    });
}

function stopDataClearJob() {
    schedule.cancelJob(refreshBoardJob);
    schedule.cancelJob(clearDataJob);
}

module.exports = {startDataClearJob, stopDataClearJob};