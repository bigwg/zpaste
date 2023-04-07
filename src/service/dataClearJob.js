const schedule = require('node-schedule');

function startDataClearJob(){
    schedule.scheduleJob('1-10 * * * * *', function(){
    });
}

module.exports = startDataClearJob;