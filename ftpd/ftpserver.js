var ftpd = require('./ftpd.min');
var fs = require('fs');
var path = require('path');
var keyFile;
var certFile;

var options = null;
var FTPserver = null;
var rootCwdListener = () => { return '/'; }; //默认

// console.log('*** To run as FTPS server,                 ***');

module.exports.initFTPdServerOptions = (_options) => {
  options = _options;
}

module.exports.createFTPServer = (createOptions) => {
  FTPserver = new ftpd.FtpServer(options.host, createOptions);
}

module.exports.initFTPServerListener = (config) => {
  FTPserver.on('error', function (error) {
    MCSERVER.infoLog('FTP RRROR'.red, error, true);
    config['errorFunc'] && config['errorFunc']();
  });

  // FTPserver.on('client:close',function(e){
  //   console.log('28 - ',e)
  // })

  FTPserver.on('client:connected', function (connection) {
    var username = null;
    // console.log('client connected: ' + connection.remoteAddress);
    connection.on('command:user', function (user, success, failure) {
      if (user.length >= 6) {
        username = user;
        success();
      } else {
        failure();
      }
    });

    connection.on('command:pass', function (pswd, success, failure) {
      if (!pswd || !username) { failure(); return; }
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
  // MCSERVER.infoLog('FTP'.green, 'FTP Module', true);
  MCSERVER.infoLog('FTP'.green, " FTP  模块监听: [ ftp://" + (MCSERVER.softConfig.FTP_ip || "127.0.0.1".yellow) + ":" + MCSERVER.softConfig.FTP_port + " ]");
}





