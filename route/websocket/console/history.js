const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');

//前端请求加载历史缓存
const HISTORY_SIZE = 64;
WebSocketObserver().listener('server/console/history', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'];

    if (permssion.isCanServer(userName, serverName)) {
        var serverT = serverModel.ServerManager().getServer(serverName)
        var dataHistory = serverT.getTerminalLog(data.WsSession['listenerQueue'], HISTORY_SIZE);
        let res = data.WsSession['listenerQueue'] -= HISTORY_SIZE;
        if (res <= 0) data.WsSession['listenerQueue'] = -1;
        // console.log('listenerQueue：', data.WsSession['listenerQueue'], 'LEN:', serverT.getTerminalLog().length); //debug
        let stringHistory = '';
        for (let i = 0; i < dataHistory.length; i++) {
            stringHistory += dataHistory[i];
        }
        if (stringHistory == '' || stringHistory.length <= 2)
            stringHistory = '------- 暂无记录历史记录，更多历史记录请查看在线文件管理的 Log 文本文件 -------<br />';
        response.wsSend(data.ws, 'server/console/history', 'terminalBack', stringHistory);
    }

});