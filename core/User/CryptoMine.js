const crypto = require('crypto');

function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

function createPassword(_password, _salt) {
    let PasswordMD5 = md5(_password);
    PasswordMD5 = PasswordMD5 + _salt;
    PasswordMD5 = md5(PasswordMD5);
    return {
        password: PasswordMD5,
        salt: _salt
    }
}

function randomString(len) {　　
    len = len || 32;　　
    var $chars = 'ABCDEFGHIJKLNMOPQRSTUVWXYZabcdefghijklnmopqrstuvwxyz1234567890';
    var maxPos = $chars.length;　　
    var pwd = '';　　
    for (i = 0; i < len; i++) {　　　　
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));　　
    }　　
    return pwd;
}


module.exports = { md5, createPassword, randomString }