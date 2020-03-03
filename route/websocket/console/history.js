const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');
const permssion = require('../../../helper/Permission');
const serverModel = require('../../../model/ServerModel');
const response = require('../../../helper/Response');


// 正序历史记录路由
WebSocketObserver().listener('server/console/history', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'] || '';

    if (permssion.isCanServer(userName, serverName)) {
        const logHistory = serverModel.ServerManager().getServer(serverName).logHistory;
        if (!logHistory) {
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', "[控制面板]: 暂无任何历史记录.\r\n");
            return;
        }
        let sendText = logHistory.readLine(userName, 30);
        if (sendText) {
            sendText = sendText.replace(/\n/gim, '\r\n');
            sendText = sendText.replace(/\r\r\n/gim, '\r\n');
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', sendText);
        } else {
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', "[控制面板]: 无法再读取更多的服务端日志.\r\n");
        }
    }
});


// 首次进入终端使用,倒序历史记录路由
WebSocketObserver().listener('server/console/history_reverse', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'] || '';

    if (permssion.isCanServer(userName, serverName)) {
        const logHistory = serverModel.ServerManager().getServer(serverName).logHistory;
        if (!logHistory)
            return;
        let sendText = logHistory.readLineReverse(userName, 50, true);
        if (sendText) {
            sendText = sendText.replace(/\n/gim, '\r\n');
            sendText = sendText.replace(/\r\r\n/gim, '\r\n');
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', sendText);
        }
    }
});


// 历史指针重置路由
WebSocketObserver().listener('server/console/history_reset', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'] || '';

    if (permssion.isCanServer(userName, serverName)) {
        const logHistory = serverModel.ServerManager().getServer(serverName).logHistory;
        if (!logHistory)
            return;
        logHistory.setPoint(userName, 0);

    }
});