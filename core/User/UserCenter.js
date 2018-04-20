const {
    User,
    USER_SAVE_PATH
} = require('./User');
const {
    md5,
    createPassword,
    randomString
} = require('./CryptoMine');
const fs = require('fs');

const USER_DIR = './' + USER_SAVE_PATH;

class UserCenter {
    constructor() {
        this.userList = {};
    }

    initUser() {
        this.userList = {};
        let users = fs.readdirSync(USER_DIR);
        let username = null;
        let userTemp = null;
        //当管理员忘记密码时候使用
        let masterUserCounter = 0;
        for (let key in users) {
            if (users[key].substr(0, 1) == '#') masterUserCounter++;
            username = users[key].replace('.json', '');
            userTemp = new User(username);
            userTemp.load();
            this.userList[username] = userTemp;
        }
        //卧槽还真全部删除了 管理员账号？我认输，我们新建一个把
        if (masterUserCounter == 0) {
            this.userList['#master'] = this.register('#master', '123456');
            MCSERVER.log('========================================================');
            MCSERVER.log('收到命令用户机制初始化 | 创建账号: #master 密码 123456');
            MCSERVER.log('========================================================');
            MCSERVER.log('请注意！凡是以 # 符号开头的用户名,均视为管理员账号');
        }

    }

    register(username, password) {
        let data = createPassword(password, randomString(6));
        let newUser = new User(username, data.password, data.salt);
        newUser.save();
        this.userList[username] = newUser;
        return newUser;
    }

    //理应只有管理员可以操作
    rePassword(username, password) {
        let data = createPassword(password, randomString(6));
        this.get(username).dataModel.password = data.password;
        this.get(username).dataModel.salt = data.salt;
        this.userList[username].save();
    }

    //理应只有管理员可以操作
    reUsername(username, newUsername) {
        let oldDataModel = this.userList[username].dataModel;
        let newUser = new User(newUsername, oldDataModel.password, oldDataModel.salt);
        //移植數據
        // for (let k in oldDataModel) {
        //     if (k == '__filename__') continue;
        //     newUser.dataModel[k] = oldDataModel[k];
        // }
        newUser.dataModel.createDate = oldDataModel.createDate;
        newUser.dataModel.lastDate = oldDataModel.lastDate;
        newUser.allowedServer(oldDataModel.allowedServer || []);
        newUser.save();
        this.userList[newUsername] = newUser;
        this.deleteUser(username);
    }

    loginCheck(username, password, truecb, falsecb, md5key, notSafeLogin = false) {
        if (this.userList.hasOwnProperty(username) && this.userList[username] != undefined) {
            let loginUser = this.userList[username];
            try {
                //BUG Note: loginUser 同步问题
                //第二次审查，否定
                loginUser.load();
            } catch (e) {
                falsecb && falsecb();
                throw e;
                return false;
            }
            loginUser.updateLastDate();

            // 目前只准许 登陆时使用 md5传码方式 ，不准传输明文
            if (md5key && !notSafeLogin) {
                let userMd5 = loginUser.getPasswordMD5();
                let md5Passworded = md5(userMd5 + md5key);
                return md5Passworded === password ? truecb && truecb(loginUser) : falsecb && falsecb();
            }

            // 一般模式 供ftp 等登录
            if (notSafeLogin && loginUser.isPassword(password)) {
                truecb && truecb(loginUser);
                return true;
            }

        }
        falsecb && falsecb();
        return false;
    }

    deleteUser(username) {
        let filePath = './' + USER_SAVE_PATH + username + '.json';
        if (fs.existsSync(filePath)) {
            delete this.userList[username];
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    get(username) {
        if (this.userList[username]) return this.userList[username];
        return null;
    }

    isExist(name) {
        if (this.userList.hasOwnProperty(name)) {
            return true;
        }
        return false;
    }

    getUserList() {
        let list = [];
        let data = {};
        let tmp = null;
        for (let k in this.userList) {
            data = {}; //BUG Note: 引用初始化

            if (!this.userList[k]) continue;
            tmp = this.userList[k].dataModel;
            //删除掉一些不可泄露的信息
            data.username = tmp.username;
            data.lastDate = tmp.lastDate;
            data.createDate = tmp.createDate;
            list.push({
                username: this.userList[k].dataModel.username,
                data: data
            });
        }
        return list;
    }

    getUserCounter() {
        let tmp = 0;
        for (let k in this.userList) tmp++;
        return tmp;
    }

    saveAllUser() {
        let objs = this.userList;
        for (let k in objs) {
            objs[k].save();
        }
    }

    returnUserObjList() {
        return this.userList;
    }



}

module.exports = UserCenter;