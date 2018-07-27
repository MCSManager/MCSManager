// MCserver Manger 程序退出
const serverModel = require('../model/ServerModel');
const userModel = require('../model/UserModel');
const counter = require('./counter');

let _endFlag = false;
process.on('SIGINT', function () {
    if (_endFlag) return;
    _endFlag = true;
    MCSERVER.infoLog('PROCESS', '控制面板正在结束与回收资源,请稍等...'.red);

    //保存
    counter.save();
    serverModel.ServerManager().saveAllMinecraftServer();
    userModel.userCenter().saveAllUser();

    //关闭所有服务器
    let servers = serverModel.ServerManager().getServerObjects();
    for (let k in servers) {
        let server = servers[k];
        try {
            //最好使用指令来关闭，这样标准输出会截取到关闭输出，而不是用 server.stop(); 
            server.send('stop');
            server.send('end');
            server.send('exit');
        } catch (serverErr) {
            //忽略
            continue;
        }
    }

    setTimeout(() => {
        MCSERVER.infoLog('PROCESS', '进程结束流程逻辑执行完毕.'.red);
        MCSERVER.infoLog('PROCESS', 'EXIT...'.red);
        process.exit(0);
    }, 4000)
});