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
    let thisServer = serverModel.ServerManager().getServer(obj.servername);

    schedulejob.createScheduleJobCount(id, obj.time, obj.count, obj.commande, obj.servername);

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
            schedules: MCSERVER.Schedule.dataModel.list
        });
    }
});

//创建计划任务
WebSocketObserver().listener('schedule/create', (data) => {
    let username = data.WsSession.username;
    let obj = JSON.parse(data.body) || {};

    if (permssion.isCanServer(username, obj.servername || "")) {
        try {
            CreateScheduleJob(obj);
            response.wsMsgWindow(data.ws, "创建计划任务成功 √");
        } catch (err) {
            response.wsMsgWindow(data.ws, "错误！创建失败:" + err);
        }
    }
});

//删除计划任务
WebSocketObserver().listener('schedule/delete', (data) => {
    let username = data.WsSession.username;
    let obj = JSON.parse(data.body) || {};

    if (permssion.isCanServer(username, obj.servername || "")) {
        try {

            schedulejob.deleteScheduleJob(obj.id || "");
            response.wsMsgWindow(data.ws, "删除序号:" + obj.id + "计划任务");
        } catch (err) {
            response.wsMsgWindow(data.ws, "删除失败！" + err);
        }
    }
});