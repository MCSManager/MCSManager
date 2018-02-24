const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const os = require("os");


//首页
WebSocketObserver().listener('index/update', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;
    response.wsSend(data.ws, 'index/update', {
        system: os.type() + " " + os.arch(),
        root: process.cwd()
    })
});