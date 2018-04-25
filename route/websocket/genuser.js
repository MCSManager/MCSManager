const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const {
    userCenter,
    beliveLogin
} = require('../../model/UserModel');
const serverModel = require('../../model/ServerModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const os = require("os");

WebSocketObserver().listener('genuser/home', (data) => {
    try {
        let username = data.WsSession.username.trim();
        let user = userCenter().get(username);
        //有一定可能是 管理员修改了用户名
        if (!user) {
            for (let i = 0; i < 5; i++)
                response.wsMsgWindow(data.ws, '您的用户资料似乎已经被修改且失效，请咨询管理员');
            data.ws.close();
            return;
        }
        let allowedServerList = user.allowedServer();
        //取当前用户在线的服务器
        let userServerList = [];
        let OnlineServerList = [];
        for (let k in allowedServerList) {
            let userHaveServer = serverModel.ServerManager().getServer(allowedServerList[k]);
            //有些用户就是喜欢取不存在的
            if (userHaveServer == undefined) continue;
            //有些数据不应该是用户可以收到的
            userServerList.push({
                serverName: userHaveServer.dataModel.name,
                lastDate: userHaveServer.dataModel.lastDate,
                createDate: userHaveServer.dataModel.createDate,
                run: userHaveServer.isRun(),
                jarName: userHaveServer.dataModel.jarName,
            });
            if (userHaveServer.isRun()) {
                OnlineServerList.push(userHaveServer.dataModel.nam);
            }
        }

        response.wsSend(data.ws, 'genuser/home', {
            username: username,
            lastDate: user.dataModel.lastDate,
            createDate: user.dataModel.createDate,
            allowedServer: allowedServerList,
            serverLen: allowedServerList.length,
            OnlineLen: OnlineServerList.length,
            AllServerLen: userServerList.length,
            userServerList: userServerList,
            OnlineServerList: OnlineServerList
        });
    } catch (err) {
        MCSERVER.error('普通用户访问异常', err);
    }

});



WebSocketObserver().listener('genuser/re_password', (data) => {

    let username = data.WsSession.username.trim();
    let config = JSON.parse(data.body);
    if (config.newPassword && config.oldPassword) {
        let user = userCenter().get(username);
        beliveLogin(username, config.oldPassword, () => {
            try {
                if (config.newPassword.length > 18 || config.newPassword.length < 6) {
                    response.wsMsgWindow(data.ws, '新的密码长度不正确，需要 6~18 位长度');
                    return;
                }
                userCenter().rePassword(username, config.newPassword);
                userCenter().initUser();
                response.wsMsgWindow(data.ws, '密码修改修改完成，请重新登陆!');
            } catch (err) {
                throw err;
            }

        }, () => {
            response.wsMsgWindow(data.ws, '很抱歉，原密码错误，无法修改');
        });
    }


});