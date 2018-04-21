var Logined = {};

module.exports.addLogined = (sessionID, username, userdata) => {
    if (username && userdata && sessionID)
        Logined[sessionID] = [username, userdata, Date.now()];
    else
        throw new Error("Username or Userdata is Null");
}

module.exports.delLogined = (sessionID) => {
    if (sessionID) {
        Logined[sessionID] = undefined;
        delete Logined[sessionID];
    } else
        throw new Error("sessionID is Null");
}


module.exports.isLogined = (sessionID, username = null) => {
    if (Logined.hasOwnProperty(sessionID) && Logined[sessionID]) {
        if (username) {
            return Logined[sessionID][0] === username;
        }
        return Logined[sessionID][1];
    }
    return null;
}

//登录验证时间删除
const MAX_AGE = MCSERVER.localProperty.session_max_age * 1000 * 60;
setInterval(() => {
    let time = Date.now();
    let oldtime = null;
    for (let k in Logined) {
        if (Logined) {
            oldtime = Logined[k][2];
            if (time - oldtime > MAX_AGE) {
                delete Logined[k];
            }
        }
    }
}, 1000 * 50); //50秒检索一遍