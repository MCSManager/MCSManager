const { WebSocketObserver } = require('../../../model/WebSocketModel');
const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');

//发送指令
WebSocketObserver().listener('server/console/command', (data) => {
    let par = JSON.parse(data.body);
    let serverName = par.serverName.trim();
    let command = par.command;
    let userName = data.WsSession.username;
    if (permssion.isCanServer(userName, serverName)) {
        //代表重启服务器
        if (command == '__restart__') {
            serverModel.ServerManager().getServer(serverName).restart();
            response.wsMsgWindow(data.ws, '服务器正在重启..');
            //return
        }
        if (command == '__killserver__') {
            serverModel.ServerManager().getServer(serverName).kill();
            response.wsMsgWindow(data.ws, '服务器结束进程');
        }
        //不是特殊命令，则直接执行
        try {
            serverModel.sendCommand(serverName, command);

        } catch (e) {
            throw e;
            response.wsSend(data.ws, 'server/console/command', null);
            response.wsMsgWindow(data.ws, '执行命令错误:' + e);
        }
        return;
    }
    response.wsSend(data.ws, 'server/console/command', null);
});

