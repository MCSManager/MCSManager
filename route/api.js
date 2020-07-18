const router = require('express')();
const serverModel = require('../model/ServerModel');
const userModel = require('../model/UserModel');
const mcPingProtocol = require('../helper/MCPingProtocol');
const apiResponse = require('../helper/ApiResponse');
const keyManager = require('../helper/KeyManager');

const fs = require('fs');


// 服务端实例状态获取 | 公共性 API 接口
// 无需任何权限判定
router.all('/status/:name', function (req, res) {
    if (MCSERVER.localProperty.allow_status_api) {
        res.send("管理员禁止此项功能 | Access denied");
        return;
    }
    let params = req.params || {};
    let serverName = params.name || "";
    let mcserver = serverModel.ServerManager().getServer(serverName.trim());
    if (mcserver == null) {
        res.send("null");
        return;
    }
    let sendStatus = null;

    // 取缓存资料
    const mcpingResult = mcPingProtocol.QueryMCPingTask(serverName)

    // 判断服务器启动状态发送不同的数据
    if (mcserver.isRun() && mcpingResult) {
        sendStatus = {
            id: serverName,
            serverName: mcserver.dataModel.mcpingConfig.mcpingName,
            lastDate: mcserver.dataModel.mcpingConfig.lastDate,
            status: mcserver.isRun(),
            current_players: mcpingResult.current_players,
            max_players: mcpingResult.max_players,
            motd: mcserver.dataModel.mcpingConfig.mcpingMotd || mcpingResult.motd,
            version: mcpingResult.version
        };
    } else {
        sendStatus = {
            id: serverName,
            lastDate: mcserver.dataModel.lastDate,
            status: mcserver.isRun(),
        };
    }

    res.send(JSON.stringify(sendStatus));
    res.end();
});


// 获取所有实例 | API
router.all('/server_list', function (req, res) {
    // 仅仅准许管理员使用
    if (!keyManager.isMaster(apiResponse.key(req))) {
        apiResponse.forbidden(res);
        return;
    }
    const list = serverModel.ServerManager().getServerList();
    apiResponse.send(res, list);
});


// 创建服务器实例 | API
router.post('/create_server', function (req, res) {
    // 仅仅准许管理员使用
    if (!keyManager.isMaster(apiResponse.key(req))) {
        apiResponse.forbidden(res);
        return;
    }
    // 解析请求参数
    try {
        const params = req.body;
        const result = serverModel.createServer(params.serverName, params);
        // 返回状态码
        result ? apiResponse.ok(res) : apiResponse.error(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 删除实例 API
router.all('/delete_server/:name', function (req, res) {
    // 仅仅准许管理员使用
    if (!keyManager.isMaster(apiResponse.key(req))) {
        apiResponse.forbidden(res);
        return;
    }
    // 解析请求参数
    const params = req.params.name;
    try {
        const result = serverModel.deleteServer(params);
        apiResponse.ok(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
    res.end();
});


// 获取所有用户 | API
router.all('/user_list', function (req, res) {
    // 仅仅准许管理员使用
    if (!keyManager.isMaster(apiResponse.key(req))) {
        apiResponse.forbidden(res);
        return;
    }
    const list = userModel.userCenter().getUserList();
    apiResponse.send(res, list);
});


// 创建用户 | API
// params.username
// params.password
// params.serverList
router.post('/create_user', function (req, res) {
    // 仅仅准许管理员使用
    if (!keyManager.isMaster(apiResponse.key(req))) {
        apiResponse.forbidden(res);
        return;
    }
    try {
        // 注册用户
        userModel.userCenter().register(req.body.username, req.body.password);
        // 注册其名下的服务端实例
        const allowedServerList = [];
        const serverList = req.body.serverlist.split(" ");
        for (const k in serverList) {
            if (serverList[k] != " " && serverList.length > 0) {
                allowedServerList.push(serverList[k]);
            }
        }
        userModel.userCenter().get(req.body.username).allowedServer(allowedServerList);
        // 数据模型保存
        userModel.userCenter().get(req.body.username).dataModel.save();
        // 返回状态码
        apiResponse.ok(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 删除用户 API
router.all('/delete_user/:name', function (req, res) {
    // 仅仅准许管理员使用
    if (!keyManager.isMaster(apiResponse.key(req))) {
        apiResponse.forbidden(res);
        return;
    }
    try {
        // 解析请求参数
        const userName = req.params.name;
        // 注册用户
        userModel.userCenter().deleteUser(userName);
        // 返回状态码
        apiResponse.ok(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 启动服务器 | API
router.all('/start_server/:name', function (req, res) {
    // 用户权限判定
    if (!keyManager.hasServer(apiResponse.key(req), req.params.name)) {
        apiResponse.forbidden(res);
        return;
    }
    try {
        // 解析请求参数
        const name = req.params.name;
        // 启动服务器
        const result = serverModel.ServerManager().startMinecraftServer(name);
        // 返回状态码
        result ? apiResponse.ok(res) : apiResponse.error(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 重启服务器 | API
router.all('/restart_server/:name', function (req, res) {
    // 用户权限判定
    if (!keyManager.hasServer(apiResponse.key(req), req.params.name)) {
        apiResponse.forbidden(res);
        return;
    }
    try {
        // 解析请求参数
        const name = req.params.name;
        // 启动服务器
        const result = serverModel.ServerManager().restartServer(name);
        // 返回状态码
        result ? apiResponse.ok(res) : apiResponse.error(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 关闭服务器 | API
router.all('/stop_server/:name', function (req, res) {
    // 用户权限判定
    if (!keyManager.hasServer(apiResponse.key(req), req.params.name)) {
        apiResponse.forbidden(res);
        return;
    }
    try {
        // 解析请求参数
        const name = req.params.name;
        // 启动服务器
        const result = serverModel.ServerManager().stopMinecraftServer(name);
        // 返回状态码
        result ? apiResponse.ok(res) : apiResponse.error(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});


// 向某服务器执行命令 | API
// params.name, params.command
router.post('/execute/', function (req, res) {
    // 用户权限判定
    if (!keyManager.hasServer(apiResponse.key(req), req.body.name)) {
        apiResponse.forbidden(res);
        return;
    }
    try {
        // 解析请求参数
        const params = req.body;
        // 启动服务器
        const result = serverModel.ServerManager().sendMinecraftServer(params.name, params.command);
        // 返回状态码
        result ? apiResponse.ok(res) : apiResponse.error(res);
    } catch (err) {
        apiResponse.error(res, err);
    }
});



//模块导出
module.exports = router;