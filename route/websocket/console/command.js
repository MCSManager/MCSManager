const { WebSocketObserver } = require("../../../model/WebSocketModel");
const response = require("../../../helper/Response");
var serverModel = require("../../../model/ServerModel");
const permssion = require("../../../helper/Permission");

const mcPingProtocol = require("../../../helper/MCPingProtocol");

//发送指令
WebSocketObserver().listener("server/console/command", (data) => {
  let par = JSON.parse(data.body);
  let serverName = par.serverName.trim();
  let command = par.command;
  let userName = data.WsSession.username;
  if (permssion.isCanServer(userName, serverName)) {
    //代表重启服务器
    if (command == "__restart__") {
      serverModel.ServerManager().getServer(serverName).restart();
      response.wsMsgWindow(data.ws, "服务器正在重启..");
      return;
    }
    //强制结束服务端进程
    if (command == "__killserver__") {
      serverModel.ServerManager().getServer(serverName).kill();
      response.wsMsgWindow(data.ws, "服务器结束进程");
      return;
    }
    //通过命令方法停止服务端
    if (command == "__stop__") {
      let server = serverModel.ServerManager().getServer(serverName);
      let isRestart = server.dataModel.autoRestart;
      if (isRestart) {
        server.dataModel.autoRestart = false;
        server._onceStopRestart = true;
      }
      server.stopServer();
      return;
    }
    //不是特殊命令，则直接执行
    serverModel.sendCommand(serverName, command);
    return;
  }
  response.wsSend(data.ws, "server/console/command", null);
});

//服务端退出之后第一事件
//当服务端开启自动崩溃重启后，手动关闭服务端时将忽略临时重启规则
serverModel.ServerManager().on("exit_next", (data) => {
  let server = serverModel.ServerManager().getServer(data.serverName);
  if (server._onceStopRestart) {
    server.dataModel.autoRestart = true;
    server._onceStopRestart = false;
  }

  // 关闭 mcping 定时器
  mcPingProtocol.DestroyMCPingTask(data.serverName);
});
