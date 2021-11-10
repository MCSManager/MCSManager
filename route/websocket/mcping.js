const { WebSocketObserver } = require("../../model/WebSocketModel");
const { userCenter } = require("../../model/UserModel");
const serverModel = require("../../model/ServerModel");
const permssion = require("../../helper/Permission");
const response = require("../../helper/Response");

// 保存配置
WebSocketObserver().listener("mcping/config_save", (data) => {
  const jsonObject = JSON.parse(data.body);
  const serverName = jsonObject.mcpingServerName;
  const userName = data.WsSession.username;
  const user = userCenter().get(userName);
  if (!user) {
    return;
  }
  if (permssion.isCanServer(userName, serverName)) {
    const mcserver = serverModel.ServerManager().getServer(serverName);
    mcserver.dataModel.mcpingConfig = {
      mcpingName: jsonObject.mcpingConfig.mcpingName || "",
      mcpingHost: jsonObject.mcpingConfig.mcpingHost || "",
      mcpingPort: jsonObject.mcpingConfig.mcpingPort || "",
      mcpingMotd: jsonObject.mcpingConfig.mcpingMotd || "",
    };
    // console.log('mcping mcserver.dataModel:', mcserver.dataModel)
    mcserver.dataModel.save();
  }
  response.wsSend(data.ws, "mcping/config_save", true);
});

// 获取配置
// 获取配置是公开的，任何人可以获取到你填写的配置，无权限控制
WebSocketObserver().listener("mcping/config", (data) => {
  const serverName = data.body || "";
  if (serverName) {
    const mcserver = serverModel.ServerManager().getServer(serverName);
    response.wsSend(data.ws, "mcping/config", mcserver.dataModel.mcpingConfig);
    mcserver.dataModel.save();
  }
});
