const ServerManager = require('../core/Process/ServerCenter');
const fs = require('fs');

// 事实上，Node.js 的缓存机制可以间接的到达单列模式的目的
var onlyServerManager = new ServerManager();
// module.exports.ServerManager = onlyServerManager;
function getServerDir(serverName) {
    return './server/server_core/' + serverName + '/';
}

module.exports.getServerDir = getServerDir;

module.exports.ServerManager = () => {
    return onlyServerManager;
}

//后来维护添加的 优先创建根目录
module.exports.createServerDir = (serverName, cwd) => {
    if (cwd == '' || cwd == '<默认标准位置>')
        cwd = getServerDir(serverName);
    if (!fs.existsSync(cwd)) {
        fs.mkdirSync(cwd);
    }
    //EULA.txt 写入
    fs.writeFile(cwd + '/eula.txt', 'eula=true', () => { });
}

module.exports.createServer = (serverName, config) => {
    if (config.cwd == '' || config.cwd == '<默认标准位置>')
        config.cwd = getServerDir(serverName);
    if (!fs.existsSync(config.cwd)) {
        fs.mkdirSync(config.cwd);
    }
    onlyServerManager.newMinecraftServer(serverName);
    onlyServerManager.builderMinecraftServer(serverName, config);
    onlyServerManager.saveMinecraftServer(serverName);
    return true;
}

module.exports.deleteServer = (serverName) => {
    return onlyServerManager.delMinecraftServer(serverName);
}

module.exports.startServer = (serverName) => {
    if (onlyServerManager.isExist(serverName)) {
        return onlyServerManager.startMinecraftServer(serverName);
    }
    return false;
}

module.exports.stopServer = (serverName) => {
    if (onlyServerManager.isExist(serverName)) {
        return onlyServerManager.stopMinecraftServer(serverName);
    }
    return false;
}


module.exports.sendCommand = (serverName, command) => {
    if (onlyServerManager.isExist(serverName)) {
        return onlyServerManager.sendMinecraftServer(serverName, command);
    }
    return false;
}

module.exports.builder = (serverName, config) => {
    onlyServerManager.builderMinecraftServer(serverName, config);
    onlyServerManager.saveMinecraftServer(serverName);
}


//服务端中心 用于判断所有运行服务端是否到期 | 每2个小时检查一次
//https://www.npmjs.com/package/node-schedule
const schedule = require("node-schedule");
schedule.scheduleJob('1 0 */2 * * *', function () {
    let serverCollect = onlyServerManager.getServerObjects();
    try {
        for (let k in serverCollect) {
            let server = serverCollect[k];
            if (server && server.isRun()) {
                let res = server.isDealLineDate();
                if (res) {
                    MCSERVER.log('[时间期限] 服务端 [', server.dataModel.name, ']', '于现在过期，正在执行关闭程序.');
                    //先进行标准流程关闭服务端，如果 45 秒后未关闭，则强制性结束进程
                    server.send('stop');
                    server.send('end');
                    server.send('exit');
                    setTimeout(() => {
                        server.kill();
                    }, 45 * 1000);
                }
            }
        }
    } catch (err) {
        MCSERVER.error('[时间期限] 关闭服务端时出现异常，某个服务端可能未能正确关闭:', err);
    }
});