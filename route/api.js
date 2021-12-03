const router = require("express")();
const serverModel = require("../model/ServerModel");
const userModel = require("../model/UserModel");
const mcPingProtocol = require("../helper/MCPingProtocol");
const apiResponse = require("../helper/ApiResponse");
const keyManager = require("../helper/KeyManager");
const requestLimit = require("../helper/RequestLimit");
const tools = require("../core/tools");

// 服务端实例状态获取 | 公共性 API 接口
// 无需任何权限判定
router.all("/status/:name", function (req, res) {
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
  const mcpingResult = mcPingProtocol.QueryMCPingTask(serverName);

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
      version: mcpingResult.version,
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
router.all("/server_list", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  const list = serverModel.ServerManager().getServerList();
  apiResponse.send(res, list);
});

// 创建服务器实例 | API
router.post("/create_server", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  // 解析请求参数
  try {
    const params = req.body;
    // 创建名判定
    if (!tools.between(params.serverName, 6, 32)) {
      apiResponse.error(res, new Error("名字格式不正确"));
      return;
    }
    // 附加参数解析
    const addList = (params.addCmd || "").split(" ");
    params.addCmd = addList;
    // 工作目录确定
    params.cwd = params.cwd || "";
    // 创建
    const result = serverModel.createServer(params.serverName, params);
    // 返回状态码
    result ? apiResponse.ok(res) : apiResponse.error(res);
  } catch (err) {
    apiResponse.error(res, err);
  }
});

// 删除实例 API
router.all("/delete_server/:name", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  // 解析请求参数
  const params = req.params.name;
  try {
    serverModel.deleteServer(params);
    apiResponse.ok(res);
  } catch (err) {
    apiResponse.error(res, err);
  }
  res.end();
});

// 获取所有用户 | API
router.all("/user_list", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  const list = userModel.userCenter().getAdvancedUserList();
  apiResponse.send(res, list);
});

// 生成用户KeyAPI | API
router.all("/user_apikey", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  const users = userModel.userCenter();
  let currKey = users.apiKey(req.query.username, false);
  if (currKey == "") {
    currKey = users.apiKey(req.query.username, true);
  }
  apiResponse.send(res, currKey);
});

// 创建用户 | API
// params.username
// params.password
// params.serverList
router.post("/create_user", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  try {
    // 账号密码判定
    const uPattern = /^[a-zA-Z0-9_#$]{4,18}$/;
    if (!uPattern.test(req.body.username) || !tools.between(req.body.password, 6, 18)) {
      apiResponse.error(res, new Error("用户名或密码格式不正确"));
      return;
    }
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
router.all("/delete_user/:name", function (req, res) {
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
router.all("/start_server/:name", function (req, res) {
  // 用户权限判定
  if (!keyManager.hasServer(apiResponse.key(req), req.params.name)) {
    apiResponse.forbidden(res);
    return;
  }
  // 流量限制 | 10 秒间隔
  if (!requestLimit.execute(apiResponse.key(req) + "start_server", 1000 * 10)) {
    apiResponse.unavailable(res);
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
router.all("/restart_server/:name", function (req, res) {
  // 用户权限判定
  if (!keyManager.hasServer(apiResponse.key(req), req.params.name)) {
    apiResponse.forbidden(res);
    return;
  }
  // 流量限制 | 60 秒执行一次
  if (!requestLimit.execute(apiResponse.key(req) + "restart_server", 1000 * 60)) {
    apiResponse.unavailable(res);
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
router.all("/stop_server/:name", function (req, res) {
  // 用户权限判定
  if (!keyManager.hasServer(apiResponse.key(req), req.params.name)) {
    apiResponse.forbidden(res);
    return;
  }
  // 流量限制 | 1 秒间隔
  if (!requestLimit.execute(apiResponse.key(req) + "stop_server", 1000 * 1)) {
    apiResponse.unavailable(res);
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
router.post("/execute/", function (req, res) {
  // 用户权限判定
  if (!keyManager.hasServer(apiResponse.key(req), req.body.name)) {
    apiResponse.forbidden(res);
    return;
  }
  // 流量限制 | 0.5 秒间隔
  if (!requestLimit.execute(apiResponse.key(req) + "execute", 500)) {
    apiResponse.unavailable(res);
    return;
  }
  try {
    // 解析请求参数
    const params = req.body;
    // 判定服务器是否运行
    const server = serverModel.ServerManager().getServer(params.name);
    if (!server) return;
    if (!server.isRun()) {
      apiResponse.error(res, new Error("服务器非运行状态,无法投递命令"));
      return;
    }
    // 启动服务器
    const result = serverModel.ServerManager().sendMinecraftServer(params.name, params.command);
    // 返回状态码
    result ? apiResponse.ok(res) : apiResponse.error(res);
  } catch (err) {
    apiResponse.error(res, err);
  }
});

// 创建服务器实例（JSON） | API
router.post("/advanced_create_server", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  // 解析请求参数
  try {
    const params = req.body;
    const config = JSON.parse(params.config);
    // 创建
    const result = serverModel.createServer(params.serverName, config);
    // 返回状态码
    result ? apiResponse.ok(res) : apiResponse.error(res);
  } catch (err) {
    apiResponse.error(res, err);
  }
});

// 修改服务器实例（JSON） | API
router.post("/advanced_configure_server", function (req, res) {
  // 仅仅准许管理员使用
  if (!keyManager.isMaster(apiResponse.key(req))) {
    apiResponse.forbidden(res);
    return;
  }
  // 解析请求参数
  try {
    const params = req.body;
    const config = JSON.parse(params.config);
    // 使用松散配置模式
    config.modify = true;
    const server = serverModel.ServerManager().getServer(params.serverName);
    if (!server) {
      apiResponse.error(res, "服务器并不存在");
      return;
    }
    // 不更名的情况重新构建服务器实例
    server.builder(config);
    apiResponse.ok(res);
  } catch (err) {
    apiResponse.error(res, err);
  }
});

//模块导出
module.exports = router;
