const MinecraftServer = require("./Mcserver");
const EventEmitter = require("events");
const fs = require("fs-extra");
const mcPingProtocol = require("../../helper/MCPingProtocol");

const BASE_SERVER_DIR = "./server/";

class ServerManager extends EventEmitter {
  constructor(args) {
    super(args);
    this.serverList = {};
  }

  newMinecraftServer(name) {
    // eslint-disable-next-line no-prototype-builtins
    if (!this.serverList.hasOwnProperty(name)) {
      this.serverList[name] = new MinecraftServer(name);
      this._bindEvent(name);
      return true;
    }
    throw new Error("同名的服务器已存在");
  }

  delMinecraftServer(name) {
    try {
      fs.removeSync(BASE_SERVER_DIR + name + ".json");
      fs.remove(this.serverList[name].dataModel.cwd);
      delete this.serverList[name];
      return true;
    } catch (err) {
      throw new Error("删除服务器出现错误，删除失败并且服务器可能已经损坏:" + err);
    }
  }

  builderMinecraftServer(name, configArgs) {
    if (this.isExist(name)) return this.serverList[name].builder(configArgs);
  }

  loadMinecraftServer(name) {
    if (this.isCreate(name)) {
      if (this.isExist(name)) {
        return this.serverList[name].load();
      }
      this.newMinecraftServer(name);
      return this.loadMinecraftServer(name);
    }
    return false;
  }

  saveMinecraftServer(name) {
    if (this.isExist(name)) return this.serverList[name].save();
  }

  saveAllMinecraftServer() {
    for (let key in this.serverList) {
      this.saveMinecraftServer(this.serverList[key]);
    }
  }

  loadALLMinecraftServer() {
    let serverName = null;
    let serverList = fs.readdirSync(BASE_SERVER_DIR);
    for (let key in serverList) {
      serverName = serverList[key].replace(".json", "");
      this.loadMinecraftServer(serverName);
    }
  }

  startMinecraftServer(name) {
    if (!this.isExist(name)) throw new Error("您选择的服务器 [" + name + "] 似乎不存在，请重新创建或检查数据是否完整。");
    if (this.serverList[name].isRun()) throw new Error("服务器已经运行,无法再继续运行");
    return this.serverList[name].start();
  }

  stopMinecraftServer(name) {
    if (this.isExist(name)) {
      const server = this.serverList[name];
      server.stopServer();
      return true;
    }
    return false;
  }

  restartServer(name) {
    if (this.isExist(name)) {
      const server = this.serverList[name];
      return server.restart();
    }
    return false;
  }

  sendMinecraftServer(name, command) {
    if (this.isExist(name)) return this.serverList[name].send(command);
    return false;
  }

  isExist(name) {
    // eslint-disable-next-line no-prototype-builtins
    if (this.serverList.hasOwnProperty(name)) {
      return true;
    }
    return false;
  }

  isCreate(name) {
    return fs.existsSync(BASE_SERVER_DIR + name + ".json");
  }

  _bindEvent(name) {
    let server = this.serverList[name];
    //监听控制台
    server.on("console", (data) => {
      this.emit("console", {
        serverName: name,
        command: "CONSOLE",
        msg: data,
      });
    });
    //监听退出
    server.on("exit", (code) => {
      this.emit("exit", {
        serverName: name,
        command: "EXIT",
        msg: code,
      });
    });
    server.on("open", (server) => {
      this.emit("open", {
        serverName: name,
        command: "OPEN",
        msg: server,
      });
    });
    server.on("error", (err) => {
      this.emit("open", {
        serverName: name,
        command: "ERROR",
        msg: err,
      });
    });
  }

  reServerName(oldServerName, newServerName) {
    let oldDataModel = this.serverList[oldServerName].dataModel;
    let newMinecraftServer = new MinecraftServer(newServerName);
    //移植數據
    for (let k in oldDataModel) {
      if (k == "__filename__") continue;
      if (k == "name") continue;
      if (k == "serverName") continue;
      newMinecraftServer.dataModel[k] = oldDataModel[k];
    }
    newMinecraftServer.save();
    this.serverList[newServerName] = newMinecraftServer;
    //绑定事件
    this._bindEvent(newServerName);
    this.delMinecraftServer(oldServerName);
    return true;
  }

  getServerList() {
    // return this.serverList;
    let list = [];
    let returnData = null;
    for (let k in this.serverList) {
      // 从服务端模型中获取数据
      returnData = this.serverList[k].dataModel;
      returnData.run = this.serverList[k].isRun();
      // 从缓存中获取玩家数量
      const mcpingResult = mcPingProtocol.QueryMCPingTask(k);
      if (mcpingResult) {
        returnData.currentPlayers = mcpingResult.current_players;
        returnData.maxPlayers = mcpingResult.max_players;
      } else {
        returnData.currentPlayers = "--";
        returnData.maxPlayers = "--";
      }
      // 准备发送给前端的服务端集合数据
      list.push({
        serverName: k,
        data: returnData,
      });
    }
    return list;
  }

  getServerCounter() {
    let tmp = 0;
    // eslint-disable-next-line no-unused-vars
    for (let k in this.serverList) tmp++;
    return tmp;
  }

  getRunServerCounter() {
    let tmp = 0;
    for (let k in this.serverList) {
      if (this.serverList[k].isRun()) tmp++;
    }
    return tmp;
  }

  /**
   *
   *
   * @param {*} serverName
   * @returns {MinecraftServer}
   * @memberof ServerManager
   */
  getServer(serverName) {
    if (this.serverList[serverName]) return this.serverList[serverName];
    return undefined;
  }

  getServerObjects() {
    return this.serverList;
  }
}

module.exports = ServerManager;
