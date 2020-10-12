// MCserver Manger 程序退出
const serverModel = require("../model/ServerModel");
const userModel = require("../model/UserModel");
const counter = require("./counter");

let _endFlag = false;
process.on("SIGINT", function () {
  if (_endFlag) return;
  _endFlag = true;
  MCSERVER.infoLog("PROCESS", "控制面板正在结束与回收资源,请稍等...");

  // 保存
  counter.save();
  serverModel.ServerManager().saveAllMinecraftServer();
  userModel.userCenter().saveAllUser();

  // 关闭所有服务器
  let servers = serverModel.ServerManager().getServerObjects();
  for (let k in servers) {
    let server = servers[k];
    try {
      server.stopServer();
    } catch (serverErr) {
      continue;
    }
  }

  // 异步等待3秒，控制面板自动结束
  setTimeout(() => {
    MCSERVER.infoLog("PROCESS", "EXIT...");
    process.exit(0);
  }, 3000);
});
