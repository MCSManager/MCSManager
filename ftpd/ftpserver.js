var fs = require('fs');
var path = require('path');

//因为这库在旧版本节点上有问题，所以从 github 获取最新版本
//npm i https://github.com/sstur/nodeftpd.git --save
var ftpdzz = require('ftpd');

var keyFile;
var certFile;

var options = null;
var FTPserver = null;
var rootCwdListener = () => {
  return '/';
}; //默认

module.exports.initFTPdServerOptions = (_options) => {
  options = _options;
}

module.exports.createFTPServer = (createOptions) => {
  FTPserver = new ftpdzz.FtpServer(options.host, createOptions);
}

module.exports.initFTPServerListener = (config) => {
  FTPserver.on('error', function (error) {
    MCSERVER.infoLog('FTP RRROR'.red, error, true);
    config['errorFunc'] && config['errorFunc']();
  });


  FTPserver.on('client:connected', function (connection) {
    var username = null;
    connection.on('command:user', function (user, success, failure) {
      if (user.length >= 6) {
        username = user;
        success();
      } else {
        failure();
      }
    });

    connection.on('command:pass', function (pswd, success, failure) {
      if (!pswd || !username) {
        failure();
        return;
      }
      //通过外接函数
      let result = config['loginCheck'](connection, username, pswd);
      if (result) {
        success(username);
      } else {
        failure();
      }
    });
  });
}

module.exports.getFTPserver = () => {
  return FTPserver;
}

module.exports.runFTPServer = () => {
  FTPserver.debugging = 0;
  FTPserver.listen(options.port);

  MCSERVER.infoLog('FTP'.green, [" FTP  被动传输端口范围: [",
    MCSERVER.localProperty.ftp_start_port,
    "-",
    MCSERVER.localProperty.ftp_end_port,
    "]"
  ].join(" "));

  MCSERVER.infoLog('FTP'.green,
    " FTP  模块监听: [ ftp://" +
    (options.host || "127.0.0.1".yellow) +
    ":" + options.port + " ]");

}