const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const counter = require('../../core/counter');
const response = require('../../helper/Response');
const serverModel = require('../../model/ServerModel');
const userModel = require('../../model/UserModel');
const permssion = require('../../helper/Permission');
const observerModel = require('../../model/ObserverModel');
const EventEmitter = require('events');


const os = require("os");
const MB_SIZE = 1024 * 1024;
const EventObserver = new EventEmitter();

//日志缓存记录器
MCSERVER.consoleLog = {};

//控制台信息广播
//使用万年蠢逼 Mg 设计方案
function selectWebsocket(serverName, callback) {
    let all = MCSERVER.allSockets;
    for (let k in all) {
        if (all[k]['console'] === serverName) {
            callback(all[k]);
        }
    }
}

//服务器异常
serverModel.ServerManager().on('error', (data) => {
    MCSERVER.infoLog('Error'.red, '[' + data.serverName + '] >>> 异常', true);
    selectWebsocket(data.serverName, (socket) => {
        response.wsMsgWindow(socket.ws, "服务器异常:" + data.msg);
    });
})

//服务器退出
serverModel.ServerManager().on('exit', (data) => {
    MCSERVER.log('[' + data.serverName + '] >>> 进程退出');
    let server = serverModel.ServerManager().getServer(data.serverName);
    if (server.dataModel.autoRestart) {
        //自动重启
        setTimeout(() => {
            serverModel.startServer(data.serverName);
        }, 5000);
        selectWebsocket(data.serverName,
            (socket) => response.wsMsgWindow(socket.ws, '检测到服务器关闭，稍后将根据任务自动重启！'));
        return;
    }
    selectWebsocket(data.serverName,
        (socket) => response.wsMsgWindow(socket.ws, '服务器关闭'));
})

//服务器开启
serverModel.ServerManager().on('open', (data) => {
    MCSERVER.log('[' + data.serverName + '] >>> 进程创建');
    selectWebsocket(data.serverName, (socket) => {
        response.wsMsgWindow(socket.ws, '服务器运行');
    });
})


//控制请求监听控制台实例
WebSocketObserver().listener('server/console/ws', (data) => {

    let userName = data.WsSession.username;
    let serverName = data.body.trim();
    // console.log('[' + serverName + '] >>> 用户 ' + userName + ' 请求控制台监听');
    //可以将 user 实例化存在Session中，以便于只读的使用。。。。
    if (permssion.isCanServer(userName, serverName)) {
        var serverT = serverModel.ServerManager().getServer(serverName);
        MCSERVER.log('[' + serverName + '] >>> 准许用户 ' + userName + ' 控制台监听');
        data.WsSession['console'] = serverName;
        //set log控制台记录器
        data.WsSession['listenerQueue'] = serverT.getTerminalLog().length - 1;
        response.wsMsgWindow(data.ws, '监听 [' + serverName + '] 终端');
        return;
    } else {
        MCSERVER.log('[' + serverName + '] 拒绝用户 ' + userName + ' 控制台监听');
    }
    data.WsSession['console'] = undefined;
    response.wsSend(data.ws, 'server/console/ws', null);
});

//前端退出控制台界面
WebSocketObserver().listener('server/console/remove', (data) => {
    //单页退出时触发
    for (let k in MCSERVER.allSockets) {
        if (MCSERVER.allSockets[k].uid == data.WsSession.uid) {
            MCSERVER.allSockets[k]['console'] = undefined;
            // console.log('前端退出控制台界面  -- 成功')
            return;
        }
    }
});

serverModel.ServerManager().on('console', (data) => {
    let server = serverModel.ServerManager().getServer(data.serverName);
    let consoleData = data.msg.replace(/\n/gim, '<br />');

    //将输出载入历史记录  这里曾出现过 server 未定义bug，情况不明，已加保险
    if (server) server.terminalLog(consoleData);

    selectWebsocket(data.serverName, (socket) => {
        socket.send({
            ws: socket.ws,
            resK: 'server/console/ws',
            resV: {},
            body: consoleData
        });
    });
});


const {
    autoLoadModule
} = require("../../core/tools");
autoLoadModule('route/websocket/console', 'console/', (path) => {
    require(path);
});