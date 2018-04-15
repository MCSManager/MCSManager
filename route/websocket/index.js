const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const os = require("os");

//前端显示版本
//每次更新之后,修改此处,表明修改
//这样, 用户截图时, 可以知道具体的版本
const oversion = "Release_8.2.6.1"; //前端
const tversion = "Release_8.2.6.2"; //后端

//首页
WebSocketObserver().listener('index/update', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;
    response.wsSend(data.ws, 'index/update', {
        system: os.type() + " " + os.arch(),
        root: process.cwd(),
        oneversion: oversion,
        twoversion: tversion
    })
});