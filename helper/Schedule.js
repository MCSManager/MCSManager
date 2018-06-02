const schedule = require("node-schedule");
const DataModel = require('../core/DataModel');
const fs = require('fs');

const PATH = 'server/_ schedule _.js';

MCSERVER.Schedule = {};
MCSERVER.Schedule.container = {};
MCSERVER.Schedule.dataModel = new DataModel(PATH)
MCSERVER.Schedule.dataModel.list = [];

module.exports.init = () => {
    if (fs.existsSync(PATH))
        MCSERVER.Schedule.dataModel.load();
    else
        MCSERVER.Schedule.dataModel.save();
}

//循环型任务
module.exports.createScheduleJob = (id, time, commande, callback) => {
    let mask = MCSERVER.Schedule.container[id] = schedule.scheduleJob(time, (fireDate) => {
        let res = callback();
        if (res === false) {
            mask.cancel();
        }
    });
    if (mask) {
        MCSERVER.Schedule.dataModel.list.push({
            id: id,
            count: 0,
            time: time,
            commande: commande
        });
    }
    MCSERVER.Schedule.dataModel.save();
}

//计次型任务
module.exports.createScheduleJobCount = (id, time, count, commande, callback) => {
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
    if (mask) {
        MCSERVER.Schedule.dataModel.list.push({
            id: id,
            count: count,
            time: time,
            commande: commande
        });
    }
    MCSERVER.Schedule.dataModel.save();
}

//删除
module.exports.deleteScheduleJob = (id) => {
    let mask = MCSERVER.Schedule.container[id] || null;
    if (mask) {
        mask.cancel();
    }
    delete MCSERVER.Schedule.container[id];
    for (const key in MCSERVER.Schedule.dataModel.list) {
        const element = MCSERVER.Schedule.dataModel.list[key];
        if (element.id == id) {
            delete MCSERVER.Schedule.dataModel.list[key];
        }
    }
    MCSERVER.Schedule.dataModel.save();
}