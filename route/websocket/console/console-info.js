const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');
const os = require('os');



//控制台信息获取
WebSocketObserver().listener('server/console', (data) => {
    // permssion.needLogin(req, res);
    let userName = data.WsSession.username;
    let serverName = data.body.trim();

    if (permssion.isCanServer(userName, serverName)) {
        let serverData = serverModel.ServerManager().getServer(serverName);
        let sysMonery = ((os.freemem() / 1024) / (os.totalmem() / 1024) * 100).toFixed(2);
        let cpu = MCSERVER.dataCenter.cacheCPU;
        response.wsSend(data.ws, 'server/console', {
            serverData: serverData.dataModel,
            run: serverData.isRun(),
            sysMonery: sysMonery,
            sysCpu: MCSERVER.dataCenter.cacheCPU,
            CPUlog: MCSERVER.logCenter.CPU,
            RAMlog: MCSERVER.logCenter.RAM,
            FTP_ip: MCSERVER.localProperty.ftp_ip,
            FTP_port: MCSERVER.localProperty.ftp_port,
        });
        // MCSERVER.log('准许用户 [' + userName + '] 获取控制台实时数据');

    }

});