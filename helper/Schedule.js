const schedule = require("node-schedule");
const DataModel = require('../core/DataModel');
const fs = require('fs');

const PATH = 'server/_ schedule _.js';

MCSERVER.Schedule = {};
MCSERVER.Schedule.container = {};
MCSERVER.Schedule.dataModel = new DataModel(PATH)
MCSERVER.Schedule.dataModel.list = [];

function serverExe(commande) {
    console.log("执行:" + commande)
}

module.exports.init = () => {
    try {
        MCSERVER.Schedule.dataModel.load();
    } catch (err) {
        MCSERVER.Schedule.dataModel.save();
    }
    for (const key in MCSERVER.Schedule.dataModel.list) {
        const element = MCSERVER.Schedule.dataModel.list[key];
        if (element == null) continue;
        createScheduleJobCount(element.id, element.time, element.count, element.commande, element.servername,
            null, false);
    }
}

//计次型任务
function createScheduleJobCount(id, time, count, commande, servername, callback, _save = true) {
    let lco = 0;
    let mask = MCSERVER.Schedule.container[id] = schedule.scheduleJob(time, (fireDate) => {
        if (lco >= count && count > 0) {
            deleteScheduleJob(id);
            return;
        }
        lco++;
        serverExe(commande);
        callback && callback(commande);

    });
    if (mask) {
        MCSERVER.Schedule.dataModel.list.push({
            id: id,
            count: count,
            time: time,
            commande: commande,
            servername: servername
        });
    }
    if (_save)
        MCSERVER.Schedule.dataModel.save();
}
module.exports.createScheduleJobCount = createScheduleJobCount;


//删除
function deleteScheduleJob(id) {
    let mask = MCSERVER.Schedule.container[id] || null;
    MCSERVER.Schedule.container[id] = undefined;
    for (const key in MCSERVER.Schedule.dataModel.list) {
        const element = MCSERVER.Schedule.dataModel.list[key];
        if (element.id == id) {
            delete MCSERVER.Schedule.dataModel.list[key];
        }
    }
    MCSERVER.Schedule.dataModel.save();
    if (mask) {
        mask.cancel();
    }
}
module.exports.deleteScheduleJob = deleteScheduleJob;