const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const permssion = require('../../helper/Permission');
const response = require('../../helper/Response');
const schedulejob = require('../../helper/Schedule');
const UUID = require('uuid');
const tools = require('../../core/tools');
const serverModel = require('../../model/ServerModel');


let e = {
    servername: "xxxxxx",
    commande: "xxxxxx",
    timestr: "",
    count: 0
}

function CreateScheduleJob(obj) {
    let id = tools.randomString(6) + "_" + new Date().getTime();
    if (obj.count <= 0) {
        schedulejob.createScheduleJob(id, obj.timestr, () => {

        });
    } else {
        schedulejob.createScheduleJobCount(id, obj.timestr, obj.count, () => {

        });
    }
}

//列出计划任务
WebSocketObserver().listener('schedule/list', (data) => {
    let username = data.WsSession.username;
    let servername = data.body;

    if (permssion.isCanServer(username, servername)) {
        let thisServer = serverModel.ServerManager().getServer(servername);
        response.wsSend(data.ws, 'schedule/list', {
            username: data.WsSession.username,
            servername: servername,
            schedules: [{
                id: "test_123456",
                count: 0,
                time: "5 * * * * *",
                commande: "__restart__",
            }, {
                id: "test_123456",
                count: 0,
                time: "5 * * * * *",
                commande: "__restart__",
            }, {
                id: "test_123456",
                count: 0,
                time: "5 * * * * *",
                commande: "__restart__",
            }]
        });
    } else {
        MCSERVER.log('权限不足！');
    }
});

//创建计划任务
WebSocketObserver().listener('schedule/create', (data) => {
    let username = data.WsSession.username;
    let obj = JSON.parse(data.body);

    if (permssion.isCanServer(username, obj.servername || "")) {
        CreateScheduleJob(obj);
    } else {
        MCSERVER.log('权限不足！');
    }
});

//删除计划任务
WebSocketObserver().listener('schedule/delete', (data) => {
    let username = data.WsSession.username;
    let obj = JSON.parse(data.body);

    if (permssion.isCanServer(username, obj.servername || "")) {
        schedulejob.deleteScheduleJob(obj.id);
    } else {
        MCSERVER.log('权限不足！2');
    }
});