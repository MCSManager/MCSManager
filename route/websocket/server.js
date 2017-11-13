const { WebSocketObserver } = require('../../model/WebSocketModel');
const serverModel = require('../../model/ServerModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const os = require("os");


WebSocketObserver().listener('server/view', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;
    let value = serverModel.ServerManager().getServerList();
    response.wsSend(data.ws, 'server/view', { items: value });
});


WebSocketObserver().listener('server/get', (data) => {
    //服务器名在 data.body 里面
    if (!permssion.isMaster(data.WsSession)) return;

    let serverName = data.body.trim();
    let mcserver = serverModel.ServerManager().getServer(serverName);
    let serverData = mcserver.dataModel;
    serverData.serverName = serverName;
    response.wsSend(data.ws, 'server/get', serverData);
});

WebSocketObserver().listener('server/create', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    let ServerConfig = JSON.parse(data.body);
    let serverName = ServerConfig.serverName.trim();
    if (serverName.indexOf('.') != -1) {
        response.wsMsgWindow(data.ws, '不可包含 "." 字符');
        return;
    }
    try {
        serverModel.createServer(serverName, ServerConfig);
    } catch (err) {
        response.wsMsgWindow(data.ws, '创建出错:' + err);
        return;
    }
    response.wsMsgWindow(data.ws, '创建完成√');
});

WebSocketObserver().listener('server/create_dir', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    let ServerConfig = JSON.parse(data.body);
    try {
        serverModel.createServerDir(ServerConfig.serverName, ServerConfig.cwd);
        response.wsMsgWindow(data.ws, '创建服务器目录已完成 √');
    } catch (e) {
        response.wsMsgWindow(data.ws, '创建目录' + ServerConfig.cwd + '出错');
    }

});



WebSocketObserver().listener('server/rebulider', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    let ServerConfig = JSON.parse(data.body);
    let oldServerName = ServerConfig.oldServerName.trim();
    let newServerName = ServerConfig.serverName.trim();
    if (oldServerName != newServerName) {
        serverModel.ServerManager().reServerName(oldServerName, newServerName);
        serverModel.builder(newServerName, ServerConfig);
        //serverModel.loadALLMinecraftServer();
    } else {
        serverModel.builder(oldServerName, ServerConfig);
    }
    response.wsSend(data.ws, 'server/rebulider', true);
    response.wsMsgWindow(data.ws, '修改完成√');
});


WebSocketObserver().listener('server/delete', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    let serverName = data.body.trim();
    try {
        serverModel.deleteServer(serverName);

        response.wsSend(data.ws, 'server/delete', true);
        response.wsMsgWindow(data.ws, '删除服务器完成√');
    } catch (e) {
        response.wsSend(data.ws, 'server/delete', null);
        response.wsMsgWindow(data.ws, '删除服务器失败' + e);
    }

});