const schedule = require("node-schedule");
const fs = require('fs');

const DataModel = require('../core/DataModel');
const serverModel = require('../model/ServerModel');

const PATH = 'server/schedule/_ schedule _.js';

MCSERVER.Schedule = {};
MCSERVER.Schedule.container = {};
MCSERVER.Schedule.dataModel = new DataModel(PATH)
MCSERVER.Schedule.dataModel.list = [];

//任务具体执行函数
function serverExe(servername, commande) {
    if (commande.length == 0) return;
    try {
        if (commande == "__start__") {
            serverModel.startServer(servername);
        }
        if (commande == "__stop__") {
            serverModel.stopServer(servername);
        }
        if (commande == "__restart__") {
            serverModel.stopServer(servername);
            setTimeout(() => {
                serverModel.startServer(servername);
            }, 15000)
        }
        // 默认执行命令
        serverModel.sendCommand(servername, commande);
    } catch (err) {
        // 默认忽略定时计划任务错误
        // MCSERVER.log("[ Schedule ] [", servername, "] 服务器计划执行时报错 | 已忽略");
    }

}

//计划任务模块初始化
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
        serverExe(servername, commande);
        callback && callback(commande);

    });
    if (mask && _save) {
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
        if (element && element.id == id) {
            MCSERVER.Schedule.dataModel.list.splice(key, 1);
            break;
        }
    }
    MCSERVER.Schedule.dataModel.save();
    if (mask) {
        mask.cancel();
    }
}
module.exports.deleteScheduleJob = deleteScheduleJob;