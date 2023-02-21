const schedule = require('node-schedule');

function startDataClearJob(){
    schedule.scheduleJob('1-10 * * * * *', function(){
        console.log('exec data clear job:' + new Date());
    });
}

module.exports = startDataClearJob;