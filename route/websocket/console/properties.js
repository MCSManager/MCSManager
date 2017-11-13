const response = require('../../../helper/Response');
var serverModel = require('../../../model/ServerModel');
var userModel = require('../../../model/UserModel');
const permssion = require('../../../helper/Permission');
const {
    WebSocketObserver
} = require('../../../model/WebSocketModel');

//获取配置
WebSocketObserver().listener('server/properties', (data) => {

    let serverName = data.body.trim();
    if (permssion.isCanServer(data.WsSession.username, serverName)) {
        serverModel.ServerManager().getServer(serverName).propertiesLoad((properties, err) => {
            if (err) {
                response.wsMsgWindow(data.ws, 'properties 文件不存在或读取出错！请自行检查或确认是否存在以及格式正确.');
                return;
            }
            response.wsSend(data.ws, 'server/properties', {
                run: serverModel.ServerManager().getServer(serverName).isRun(),
                serverName: serverName,
                properties: properties,
            });
        });

    }

});


//更新配置
WebSocketObserver().listener('server/properties_update', (data) => {

    let config = JSON.parse(data.body);
    let properties = config.properties;
    if (permssion.isCanServer(data.WsSession.username, config.serverName)) {

        try {
            serverModel.ServerManager()
                .getServer(config.serverName)
                .propertiesSave(properties, () => {
                    response.wsMsgWindow(data.ws, 'properties 更新完毕');
                });
        } catch (err) {
            MCSERVER.error('properties 重读出错', err);
            response.wsMsgWindow(data.ws, 'properties 重读出错:' + err);
        }
    }
});


//从文件重新读取
WebSocketObserver().listener('server/properties_update_reload', (data) => {

    let serverName = data.body.trim();
    if (permssion.isCanServer(data.WsSession.username, serverName)) {

        try {
            serverModel.ServerManager().getServer(serverName).propertiesLoad(() => {
                //再读一次
                let properties = serverModel.ServerManager().getServer(serverName).properties;
                if (properties == undefined) {
                    response.wsMsgWindow(data.ws, 'properties 文件不存在或读取出错，请先开启服务器以生成文件.');
                    return;
                }
                //将数据在来一次，前端路由会动态处理
                response.wsSend(data.ws, 'server/properties', {
                    run: serverModel.ServerManager().getServer(serverName).isRun(),
                    serverName: serverName,
                    properties: properties,
                });
                //信息框
                response.wsMsgWindow(data.ws, 'properties 配置重读刷新完毕');
            });
        } catch (err) {
            MCSERVER.error('properties 更新出错', err);
            response.wsMsgWindow(data.ws, 'properties 更新出错:' + err);
        }

    }
});