const { User, USER_SAVE_PATH } = require("./User");
const { md5, createPassword, randomString } = require("./CryptoMine");
const fs = require("fs");

const USER_DIR = "./" + USER_SAVE_PATH;

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
      if (users[key].substr(0, 1) == "#") masterUserCounter++;
      username = users[key].replace(".json", "");
      userTemp = new User(username);
      userTemp.load();
      this.userList[username] = userTemp;
    }
    //删除所有管理员账号后，自动创建一个新的初始化用户
    if (masterUserCounter == 0) {
      this.userList["#master"] = this.register("#master", "123456");
      MCSERVER.log("========================================================");
      MCSERVER.log("管理用户已初始化 | 创建账号: #master 密码 123456");
      MCSERVER.log("========================================================");
      MCSERVER.log("请注意！凡是以 # 符号开头的用户名,均视为管理员账号");
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
        loginUser.load();
      } catch (err) {
        falsecb && falsecb();
        return false;
      }

      // 目前只准许 登陆时使用 md5传码方式 ，不准传输明文
      if (md5key && !notSafeLogin) {
        let userMd5 = loginUser.getPasswordMD5();
        let md5Passworded = md5(userMd5 + md5key);
        let isok = md5Passworded === password;
        if (isok) {
          loginUser.updateLastDate();
          truecb && truecb(loginUser);
          return true;
        }
        falsecb && falsecb();
        return false;
      }

      // 一般模式 供可信任内部代码使用，无需要md5加密传值方式验证。
      // 感谢来自 @axuanfeng 的 BUG 反馈
      if (notSafeLogin && loginUser.isPassword(password)) {
        truecb && truecb(loginUser);
        return true;
      }
    }
    falsecb && falsecb();
    return false;
  }

  // 同时支持 更新和获取 apiKey
  // update 为 False 则返回当前 Key
  // update 为 True 则代表替换 Key
  // 最终返回当前 ApiKey
  apiKey(username, update) {
    // 检查用户账户是否存在
    if (this.userList[username]) {
      let user = this.userList[username];
      if (update) {
        user.updateApiKey();
        const value = user.dataModel.apikey;
        user.save();
        return value;
      }
      return user.dataModel.apikey;
    }
    return null;
  }

  deleteUser(username) {
    let filePath = "./" + USER_SAVE_PATH + username + ".json";
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
        data: data,
      });
    }
    return list;
  }

  getAdvancedUserList() {
    const list = [];
    for (const name in this.userList) {
      // 暴力克隆对象
      const newData = JSON.parse(JSON.stringify(this.userList[name].dataModel));
      // 删除一部分隐私
      delete newData["password"];
      delete newData["salt"];
      delete newData["__filename__"];
      delete newData["apikey"];
      list.push(newData);
    }
    return list;
  }

  getUserCounter() {
    let tmp = 0;
    // eslint-disable-next-line no-unused-vars
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
