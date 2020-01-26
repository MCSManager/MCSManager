const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');
const mcPingProtocol = require('../../../helper/MCPingProtocol');


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
            serverModel.ServerManager().emit("open_next", {
                serverName: serverName,
                userName: userName
            });
        } catch (err) {
            response.wsMsgWindow(data.ws, '' + err);
        }
        return;
    }
    response.wsSend(data.ws, 'server/console/open', null);
});

// 服务端开启后的第一事件
serverModel.ServerManager().on('open_next', (data) => {
    const server = serverModel.ServerManager().getServer(data.serverName);
    if (server) {
        // dataModel.mcpingConfig = {
        //     mcpingName: "",
        //     mcpingHost: "",
        //     mcpingPort: "",
        //     mcpingMotd: ""
        // }
        mcPingProtocol.CreateMCPingTask(data.serverName,
            server.dataModel.mcpingConfig.mcpingHost,
            parseInt(server.dataModel.mcpingConfig.mcpingPort)
        );
    }
})