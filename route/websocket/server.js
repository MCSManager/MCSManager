const { WebSocketObserver } = require("../../model/WebSocketModel");
const serverModel = require("../../model/ServerModel");
const response = require("../../helper/Response");
const permssion = require("../../helper/Permission");

WebSocketObserver().listener("server/view", (data) => {
  if (!permssion.isMaster(data.WsSession)) return;
  let value = serverModel.ServerManager().getServerList();
  response.wsSend(data.ws, "server/view", {
    items: value,
  });
});

WebSocketObserver().listener("server/get", (data) => {
  //服务器名在 data.body 里面
  if (!permssion.isMaster(data.WsSession)) return;

  let serverName = data.body.trim();
  let mcserver = serverModel.ServerManager().getServer(serverName);
  if (mcserver == null) {
    response.wsMsgWindow(data.ws, "服务端 " + serverName + " 不存在！请刷新或自行检查。");
    return;
  }

  let serverData = mcserver.dataModel;
  serverData.serverName = serverName;
  response.wsSend(data.ws, "server/get", serverData);
});

WebSocketObserver().listener("server/create", (data) => {
  if (!permssion.isMaster(data.WsSession)) return;

  let ServerConfig = JSON.parse(data.body);
  let serverName = ServerConfig.serverName.trim();
  if (serverName.indexOf(".") != -1) {
    response.wsMsgWindow(data.ws, '不可包含 "." 字符');
    return;
  }
  try {
    serverModel.createServer(serverName, ServerConfig);
  } catch (err) {
    response.wsMsgWindow(data.ws, "创建出错:" + err);
    return;
  }
  response.wsMsgWindow(data.ws, "创建完成√");
});

WebSocketObserver().listener("server/create_dir", (data) => {
  if (!permssion.isMaster(data.WsSession)) return;

  let ServerConfig = JSON.parse(data.body);
  try {
    serverModel.createServerDir(ServerConfig.serverName, ServerConfig.cwd);
    response.wsMsgWindow(data.ws, "创建服务器目录已完成 √");
  } catch (e) {
    response.wsMsgWindow(data.ws, "创建目录" + ServerConfig.cwd + "出错");
  }
});

WebSocketObserver().listener("server/rebulider", (data) => {
  if (!permssion.isMaster(data.WsSession)) return;

  let ServerConfig = JSON.parse(data.body);
  let oldServerName = ServerConfig.oldServerName.trim();
  let newServerName = ServerConfig.serverName.trim();
  const server = serverModel.ServerManager().getServer(oldServerName);
  if (server.isRun()) {
    response.wsMsgWindow(data.ws, "实例正在运行，参数无法修改，请先关闭实例");
    return;
  }
  if (oldServerName != newServerName) {
    // 暂时性禁止服务器标识名修改，重构版本后将会优化此功能
    response.wsMsgWindow(data.ws, "服务器标识名不可再更改");
    return;
    // serverModel.ServerManager().reServerName(oldServerName, newServerName);
    // serverModel.builder(newServerName, ServerConfig);
    //serverModel.loadALLMinecraftServer();
  } else {
    serverModel.builder(oldServerName, ServerConfig);
  }
  response.wsSend(data.ws, "server/rebulider", true);
  response.wsMsgWindow(data.ws, "修改完成√");
});

WebSocketObserver().listener("server/delete", (data) => {
  if (!permssion.isMaster(data.WsSession)) return;

  let serverName = data.body.trim();
  try {
    serverModel.deleteServer(serverName);

    response.wsSend(data.ws, "server/delete", true);
    response.wsMsgWindow(data.ws, "删除服务器完成√");
  } catch (e) {
    response.wsSend(data.ws, "server/delete", null);
    response.wsMsgWindow(data.ws, "删除服务器失败" + e);
  }
});

//服务器批量启动与关闭
WebSocketObserver().listener("server/opt_all", (data) => {
  if (!permssion.isMaster(data.WsSession)) return;
  let command = data.body.trim();

  try {
    let servers = serverModel.ServerManager().getServerObjects();
    for (let k in servers) {
      try {
        let server = servers[k];
        if (command == "start") {
          server.start();
        } else {
          // 临时性的关闭自动重启
          let isRestart = server.dataModel.autoRestart;
          if (isRestart) {
            server.dataModel.autoRestart = false;
            server._onceStopRestart = true;
          }
          server.stopServer();
        }
      } catch (serverErr) {
        MCSERVER.error("批量开启某服务器失败:", serverErr);
        continue;
      }
    }
    response.wsMsgWindow(data.ws, "操作执行发出！需要一定时间,具体结果请看服务端运行状态.");
  } catch (err) {
    response.wsMsgWindow(data.ws, "执行失败:" + err);
  }
});
