const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const {
    userCenter,
    deleteUser
} = require('../../model/UserModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const tools = require('../../core/tools');
const os = require("os");

WebSocketObserver().listener('userset/update', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    //添加是否在线
    let userNameList = userCenter().getUserList();
    for (let k in userNameList) {
        let userdata = userNameList[k];
        if (permssion.isOnline(userdata.username))
            userdata.data.online = true;
        else
            userdata.data.online = false;
    }

    response.wsSend(data.ws, 'userset/update', {
        items: userNameList
    });
});


WebSocketObserver().listener('userset/create', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    try {
        let newUserConfig = JSON.parse(data.body);
        if (!(newUserConfig.allowedServer instanceof Array)) {
            response.wsMsgWindow(data.ws, '用户服务器列表格式不正确');
            return;
        }
        let username = newUserConfig.username.trim();
        let password = newUserConfig.password.trim();
        var uPattern = /^[a-zA-Z0-9_#\$]{4,18}$/;
        //输出 true

        if (!uPattern.test(username) && tools.between(password, 6, 18)) {
            response.wsMsgWindow(data.ws, '用户账号或密码格式不正确');
            return;
        }

        userCenter().register(username, password);
        //去除掉空白的
        let allowedServerList = [];
        for (let k in newUserConfig.allowedServer) {
            if (newUserConfig.allowedServer[k] != " " && newUserConfig.allowedServer[k].length > 0) {
                allowedServerList.push(newUserConfig.allowedServer[k]);
            }
        }
        userCenter().get(username).allowedServer(allowedServerList);
        //其数据模型保存
        userCenter().get(username).dataModel.save();
        response.wsSend(data.ws, 'userset/create', true);
        response.wsMsgWindow(data.ws, '用户建立完成√');
        return;
    } catch (e) {
        MCSERVER.error('用户建立失败', e);
        response.wsSend(data.ws, 'userset/create', null);
        response.wsMsgWindow(data.ws, '用户建立失败: ' + e);
    }
});


WebSocketObserver().listener('userset/delete', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    try {
        let deleteObj = JSON.parse(data.body);
        let username = deleteObj.username.trim();
        deleteUser(username, () => {
            userCenter().initUser();
            response.wsSend(data.ws, 'userset/delete', true);
            response.wsMsgWindow(data.ws, '删除用户成功√');
        }, () => {
            response.wsMsgWindow(data.ws, '删除用户失败√');
        });
        return;
    } catch (e) {
        MCSERVER.error('删除用户失败', e);
        response.wsSend(data.ws, 'userset/delete', null);
        response.wsMsgWindow(data.ws, '删除用户失败:' + e);
    }
});


WebSocketObserver().listener('userset/reload', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    try {
        userCenter().initUser();
        response.wsSend(data.ws, 'userset/reload', true);
        response.wsMsgWindow(data.ws, '用户重新导入完成√');
        return;
    } catch (e) {
        MCSERVER.error('用户重新导入失败', e);
        response.wsSend(data.ws, 'userset/reload', null);
        response.wsMsgWindow(data.ws, '错误：用户重新导入失败' + e);
    }
})

//查看某個用戶信息
WebSocketObserver().listener('userset/view', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    let user = userCenter().get(data.body.trim());
    response.wsSend(data.ws, 'userset/view', {
        username: user.dataModel.username,
        lastDate: user.dataModel.lastDate,
        createDate: user.dataModel.createDate,
        allowedServer: user.dataModel.allowedServer || []
    });
});


//更新用户配置
WebSocketObserver().listener('userset/upinfo', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;

    try {
        let newUserConfig = JSON.parse(data.body);
        if (!(newUserConfig.allowedServer instanceof Array)) {
            response.wsSend(data.ws, 'userset/upinfo', null);
            return;
        }
        //去除掉空白的
        let allowedServerList = [];
        for (let k in newUserConfig.allowedServer) {
            if (newUserConfig.allowedServer[k] != " " && newUserConfig.allowedServer[k].length > 0) {
                allowedServerList.push(newUserConfig.allowedServer[k]);
            }
        }
        let username = newUserConfig.username.trim();
        let newPW = newUserConfig.newPassword.trim();
        let newUS = newUserConfig.newUsername.trim();

        //更改服务器拥有列表
        userCenter().get(username).allowedServer(allowedServerList);

        //如果需求，则更改密码
        if (newPW.trim() != '') {
            if (newPW.length < 6 || newPW.length > 18) {
                response.wsMsgWindow(data.ws, '新的密码格式不正确，已舍弃密码的更改');
            } else {
                userCenter().rePassword(username, newPW);
            }
        }

        //如果需求，则更改用户名以及存储文件
        if (username != newUS) {
            let uPattern = /^[a-zA-Z0-9_#\$]{4,18}$/;
            if (!uPattern.test(newUS)) {
                response.wsMsgWindow(data.ws, '新的用户名格式不正确，已舍弃用户名的更改');
                return;
            }
            userCenter().reUsername(username, newUS);
            userCenter().get(newUS).dataModel.save();
        } else {
            userCenter().get(username).dataModel.save();
        }

        //其数据模型保存
        response.wsMsgWindow(data.ws, '更新用户数据完成√');
        return;
    } catch (e) {
        response.wsMsgWindow(data.ws, '错误：更新用户数据错误：' + e);
    }
});