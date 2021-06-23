/*
 * @Author: Copyright(c) 2021 keywet06 & Suwings
 * @Date: 2021-06-23 09:51:55
 * @LastEditTime: 2021-06-23 10:04:31
 * @Description: 自启动任务
 */

const serverModel = require("../model/ServerModel");

module.exports.startAutoTask = () => {
  // 异步等待3秒，打开已配置打开 MCSM 时自启的服务器
  setTimeout(() => {
    const servers = serverModel.ServerManager().getServerObjects();
    for (const k in servers) {
      const server = servers[k];
      try {
        if (server.dataModel.autoStart) {
          server.start();
          MCSERVER.infoLog("INFO", "服务器" + server.dataModel.name + "已自动启动");
        }
      } catch (serverErr) {
        // 无需显示错误，因为启动时函数内部自动会输出错误信息
        MCSERVER.error("服务器" + server.dataModel.name + "自动启动错误");
        continue;
      }
    }
  }, 3000);
};
