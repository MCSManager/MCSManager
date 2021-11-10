const response = require("../../../helper/Response");
var serverModel = require("../../../model/ServerModel");
const permssion = require("../../../helper/Permission");
const { WebSocketObserver } = require("../../../model/WebSocketModel");
const mcPingProtocol = require("../../../helper/MCPingProtocol");

//开启服务器
WebSocketObserver().listener("server/console/open", (data) => {
  let serverName = data.body.trim();
  let userName = data.WsSession.username;
  if (permssion.isCanServer(userName, serverName)) {
    MCSERVER.log("用户 ", userName, " 正在启动 ", serverName, " 服务端实例...");
    try {
      let retu = serverModel.startServer(serverName);
      if (!retu) {
        response.wsMsgWindow(data.ws, "服务器无法启动,建议检查配置或权限");
        return;
      }
      response.wsSend(data.ws, "server/console/open", true);
      // 传递开启服务端事件
      serverModel.ServerManager().emit("open_next", {
        serverName: serverName,
      });
    } catch (err) {
      response.wsMsgWindow(data.ws, "" + err);
    }
    return;
  }
  response.wsSend(data.ws, "server/console/open", null);
});

// 服务端开启后的第一事件
serverModel.ServerManager().on("open_next", (data) => {
  const server = serverModel.ServerManager().getServer(data.serverName);
  const host = server.dataModel.mcpingConfig.mcpingHost || "localhost";
  if (server) {
    // 若已设定值，则使用已设定值
    if (server.dataModel.mcpingConfig.mcpingPort) {
      mcPingProtocol.CreateMCPingTask(data.serverName, host, parseInt(server.dataModel.mcpingConfig.mcpingPort));
      return;
    }
    // 首先从配置文件读取，若成功读取则使用配置文件，否则使用原值
    server.propertiesLoad((obj, err) => {
      if (err) {
        // 配置文件不存在，默认 25565，因为配置文件不存在必定先初始化
        mcPingProtocol.CreateMCPingTask(data.serverName, host, 25565);
      } else {
        // 配置文件存在，读取配置
        mcPingProtocol.CreateMCPingTask(data.serverName, host, parseInt(obj["server-port"]));
      }
    });
  }
});
