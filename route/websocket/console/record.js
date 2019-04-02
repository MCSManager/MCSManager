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
const fs = require("fs");

//前端请求加载历史缓存
const HISTORY_SIZE_LINE = 1024;
const BASE_RECORD_DIR = "./server/record_tmp/";


WebSocketObserver().listener('server/console/history', (data) => {
    let userName = data.WsSession.username;
    let bodyJson = JSON.parse(data.body);
    let serverName = bodyJson['serverName'] || '';

    if (permssion.isCanServer(userName, serverName)) {
        let recordCommande = new RecordCommand(BASE_RECORD_DIR + serverName + ".log");
        let start = data.WsSession['record_start'] || 0;
        if (start <= HISTORY_SIZE_LINE) {
            response.wsSend(data.ws, 'server/console/history', 'terminalBack',
                "[控制面板]: 无法读取更多的服务端日志: 已到最顶端.. [_b_r_]");
            return;
        }

        // 先移动指针到指定位置开始
        data.WsSession['record_start'] -= HISTORY_SIZE_LINE;
        // 从文件读取日志
        recordCommande.readRecord(data.WsSession['record_start'], HISTORY_SIZE_LINE, (resText) => {
            // 替换为 HTML
            resText = resText.replace(/\n/gim, '[_b_r_]');
            response.wsSend(data.ws, 'server/console/history', 'terminalBack', resText);
        });
    }
});



// 自动计划任务
// 每 3 分钟刷新一次日志文件，当文件大于 1MB（默认） 时删除。
const TER_MAX_SIZE = MCSERVER.localProperty.terminalQueue_max_size || 1;
setInterval(() => {
    try {
        var files = fs.readdirSync(BASE_RECORD_DIR);
        for (filename of files) {
            let path = BASE_RECORD_DIR + filename;
            let filesize = fs.statSync(path).size;
            if (filesize > 1024 * 1024 * TER_MAX_SIZE) {
                MCSERVER.infoLog("Log", "自动清除日志文件:" + path)
                // 如遇冲突，忽略不计
                fs.unlinkSync(path);
            }
        }
    } catch (err) {
        MCSERVER.infoLog("Log", "清除某日志文件: 出错，我们将下次继续:\n" + err)
    }
}, 1000 * 60 * 3);