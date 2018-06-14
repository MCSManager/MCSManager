const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');
const {
    RecordCommand
} = require('../../../helper/RecordCommand');


//前端请求加载历史缓存
const HISTORY_SIZE_LINE = 32;
const BASE_RECORD_DIR = "./core/RecordTmp/";

WebSocketObserver().listener('server/console/history', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'] || '';

    if (permssion.isCanServer(userName, serverName)) {
        let recordCommande = new RecordCommand(BASE_RECORD_DIR + serverName + ".log");
        let start = data.WsSession['record_start'] || 0;
        // 从文件读取日志
        recordCommande.readRecord(start, HISTORY_SIZE_LINE, (resText) => {
            data.WsSession['record_start'] += HISTORY_SIZE_LINE;
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', resText);
        });
    }
});