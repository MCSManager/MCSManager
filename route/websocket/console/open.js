const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const { WebSocketObserver } = require('../../../model/WebSocketModel');

//开启服务器
WebSocketObserver().listener('server/console/open', (data) => {
    let serverName = data.body.trim();
    let userName = data.WsSession.username;
    if (permssion.isCanServer(userName, serverName)) {
        try {
            let retu = serverModel.startServer(serverName);
            if (!retu) {
                response.wsMsgWindow(data.ws, '服务器无法启动,建议检查配置或权限');
                return;
            }
            response.wsSend(data.ws, 'server/console/open', true);
        } catch (err) {
            response.wsMsgWindow(data.ws, '启动出错:' + err);
        }
        return;
    }
    response.wsSend(data.ws, 'server/console/open', null);
});

