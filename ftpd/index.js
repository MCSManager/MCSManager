const ftpServerInterface = require('./ftpserver');
const userModel = require('../model/UserModel');
const permission = require('../helper/Permission');
const serverModel = require('../model/ServerModel');

ftpServerInterface.createFTPServer({
    getInitialCwd: function () {
        return '/';
    },
    getRoot: function (connected) {

        let username = connected.username;
        let arrName = username.split('.');

        if (arrName.length != 2) return null;

        let realName = arrName[0];
        let serverName = arrName[1];
        if (!realName || !serverName) return null;

        let user = userModel.userCenter().get(realName);

        let dataModel = serverModel.ServerManager().getServer(serverName).dataModel || null;
        if (dataModel) {
            MCSERVER.infoLog('Ftpd', ['用户', realName, '请求 FTP 访问 |', serverName, '| OK'].join(" "));
            return dataModel.cwd;
        }
        MCSERVER.warning('Ftpd 发现不明身份不明根目录者正在尝试访问', ['已经阻止 | 可能的值', username, serverName].join(" "));
        return null;
    },
    pasvPortRangeStart: MCSERVER.localProperty.ftp_start_port,
    pasvPortRangeEnd: MCSERVER.localProperty.ftp_end_port,
    tlsOptions: null,
    allowUnauthorizedTls: false,
    useWriteFile: false, //true 则客户端上传的文件将缓冲在内存中，然后使用写入磁盘writeFile。
    useReadFile: false,
    maxStatsAtOnce: 10,
    // uploadMaxSlurpSize: uploadMaxSlurpSize // N/A unless 'useWriteFile' is true.
});



ftpServerInterface.initFTPServerListener({
    loginCheck: (connection, username, password) => {
        let usname = username || '';
        let arrName = usname.split('.');
        let serverName = arrName[1];
        let userName = arrName[0];
        if (serverModel.ServerManager().isExist(serverName) && permission.isCanServer(userName, serverName)) {
            try {
                return userModel.beliveLogin(userName, password);
            } catch (e) {
                return false;
            }
        }
        return false;
    },
    error: () => {
        return false;
    }
});

//run
ftpServerInterface.runFTPServer();