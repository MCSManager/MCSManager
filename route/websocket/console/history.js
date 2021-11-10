const { WebSocketObserver } = require("../../../model/WebSocketModel");
const permssion = require("../../../helper/Permission");
const serverModel = require("../../../model/ServerModel");
const response = require("../../../helper/Response");

const HISTORY_SIZE_LINE = 1024;

// 正序历史记录路由
WebSocketObserver().listener("server/console/history", (data) => {
  let userName = data.WsSession.username;
  let bodyJson = JSON.parse(data.body);
  let serverName = bodyJson["serverName"] || "";

  if (permssion.isCanServer(userName, serverName)) {
    const server = serverModel.ServerManager().getServer(serverName);
    if (!server) throw new Error("查询某服务器日志历史时，此服务器并不存在。");
    const logHistory = server.logHistory;
    if (!logHistory) {
      response.wsSend(data.ws, "server/console/history", "terminalBack", "[控制面板]: 暂无任何历史记录.\r\n");
      return;
    }
    logHistory.readLine(userName, HISTORY_SIZE_LINE, (sendText) => {
      if (sendText) {
        sendText = sendText.replace(/\n/gim, "\r\n");
        sendText = sendText.replace(/\r\r\n/gim, "\r\n");
        response.wsSend(data.ws, "server/console/history", "terminalBack", sendText);
      } else {
        response.wsSend(data.ws, "server/console/history", "terminalBack", "[控制面板]: 无法再读取更多的服务端日志.\r\n");
      }
    });
  }
});

// 首次进入终端使用,倒序历史记录路由
WebSocketObserver().listener("server/console/history_reverse", (data) => {
  let userName = data.WsSession.username;
  let bodyJson = JSON.parse(data.body);
  let serverName = bodyJson["serverName"] || "";

  if (permssion.isCanServer(userName, serverName)) {
    const server = serverModel.ServerManager().getServer(serverName);
    if (!server) throw new Error("查询某服务器日志历史时，此服务器并不存在。");
    const logHistory = server.logHistory;
    if (!logHistory) return;
    logHistory.readLineOnce(userName, HISTORY_SIZE_LINE * 3, (sendText) => {
      if (sendText) {
        sendText = sendText.replace(/\n/gim, "\r\n");
        sendText = sendText.replace(/\r\r\n/gim, "\r\n");
        response.wsSend(data.ws, "server/console/history", "terminalBack", sendText);
      }
    });
  }
});

// 历史指针重置路由
WebSocketObserver().listener("server/console/history_reset", (data) => {
  let userName = data.WsSession.username;
  let bodyJson = JSON.parse(data.body);
  let serverName = bodyJson["serverName"] || "";

  if (permssion.isCanServer(userName, serverName)) {
    const server = serverModel.ServerManager().getServer(serverName);
    if (!server) throw new Error("查询某服务器日志历史时，此服务器并不存在。");
    const logHistory = server.logHistory;
    if (!logHistory) return;
    logHistory.setPoint(userName, 0);
  }
});
