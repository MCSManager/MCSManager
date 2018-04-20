//用户模型

const DataModel = require('../DataModel');
const {
    md5,
    createPassword,
    randomString
} = require('./CryptoMine');
const fs = require('fs');

const USER_SAVE_PATH = 'users/';
class User {

    constructor(username, password, salt) {
        let now = new Date().toLocaleString();
        this.dataModel = new DataModel(USER_SAVE_PATH + username);

        this.dataModel.username = username;
        this.dataModel.password = password || undefined;
        this.dataModel.salt = salt || undefined;
        this.dataModel.createDate = now;
        this.dataModel.lastDate = now;
        this.dataModel.allowedServer = [];
    }

    load() {
        this.dataModel.load();
        return this;
    }

    save() {
        this.dataModel.save();
        return this;
    }

    delete() {
        let path = './' + USER_SAVE_PATH + this.dataModel.username + '.json';
        fs.unlinkSync(path);
    }

    isPassword(password) {
        let tmp = createPassword(password, this.dataModel.salt);
        if (tmp.password === this.dataModel.password) {
            this.updateLastDate();
            return true;
        }
        return false;
    }

    getPasswordMD5() {
        return this.dataModel.password;
    }

    updateLastDate() {
        this.dataModel.lastDate = new Date().toLocaleString();
        return this;
    }

    allowedServer(list) {
        if (!list) return this.dataModel.allowedServer;
        this.dataModel.allowedServer = list;
        return this;
    }
    hasServer(serverName) {
        for (let key in this.dataModel.allowedServer) {
            if (this.dataModel.allowedServer[key] == serverName) {
                return true;
            }
        }
        return false;
    }

}


module.exports = {
    User,
    USER_SAVE_PATH
};