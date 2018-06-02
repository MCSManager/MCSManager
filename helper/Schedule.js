const schedule = require("node-schedule");

MCSERVER.Schedule = {};
MCSERVER.Schedule.container = {};


module.exports.createScheduleJob = (id, time, callback) => {
    let mask = MCSERVER.Schedule.container[id] = schedule.scheduleJob(time, (fireDate) => {
        let res = callback();
        if (res === false) {
            mask.cancel();
        }
    });
}




module.exports.createScheduleJobCount = (id, time, callback, count) => {
    let lco = 0;
    let mask = MCSERVER.Schedule.container[id] = schedule.scheduleJob(time, (fireDate) => {
        if (lco >= count) {
            mask.cancel();
            return;
        }
        lco++;
        let res = callback();
        if (res === false) {
            mask.cancel();
        }
    });
}