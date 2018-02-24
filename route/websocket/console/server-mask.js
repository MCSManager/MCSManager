const response = require('../../../helper/Response');
const serverModel = require('../../../model/ServerModel');
const userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');

//自动重启设定
WebSocketObserver().listener('server/console/autorestart', (data) => {
    let serverName = data.body.trim();
    let userName = data.WsSession.username;
    if (permssion.isCanServer(userName, serverName)) {
        let server = serverModel.ServerManager().getServer(serverName);
        server.dataModel.autoRestart = !server.dataModel.autoRestart; //反之亦然
        try {
            server.save();
            response.wsMsgWindow(data.ws, '更改设置成功！');
        } catch (err) {
            response.wsMsgWindow(data.ws, '更改设置失败！不正常，请刷新网页重新设置!');
        }
        return;
    }
    response.wsMsgWindow(data.ws, '权限不足!您并不拥有此服务器.');
});