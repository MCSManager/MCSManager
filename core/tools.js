//工具箱

module.exports.getMineTime = () => {
    var date = new Date();
    return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

module.exports.between = (value, MIN, MAX) => {
    if (typeof value === 'number') {
        return value >= MIN && value <= MAX;
    }
    if (typeof value === 'string' || value instanceof Array) {
        return value.length >= MIN && value.length <= MAX;
    }
}

const crypto = require('crypto');
module.exports.md5 = () => {
    return crypto.createHash('md5').update(text).digest('hex');
}

module.exports.randomString = (len) => {
    len = len || 64;
    var $chars = 'ABCDEFGHIJKLNMOPQRSTUVWXYZabcdefghijklnmopqrstuvwxyz1234567890_';
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

const fs = require("fs");
module.exports.autoLoadModule = (proPath, minePath, callback) => {
    let routeList = fs.readdirSync('./' + proPath);
    for (let key in routeList) {
        let name = routeList[key].replace('.js', '');
        try {
            callback('./' + minePath + name, proPath);
        } catch (err) {
            MCSERVER.error("autoLoadModule load 过程出错", err);
            throw err;
        }
    }
}


module.exports.mCopyFileSync = (oldpath, newpath) => {
    let resetData = fs.readFileSync(oldpath, {
        encoding: 'UTF-8'
    });
    fs.writeFileSync(newpath, resetData, {
        encoding: 'UTF-8'
    });
    return true;
}