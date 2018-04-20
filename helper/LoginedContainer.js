var Logined = {};

module.exports.addLogined = (username, userdata) => {
    if (username && userdata)
        Logined[username] = userdata;
    else
        throw new Error("Username or Userdata is Null");
}

module.exports.delLogined = (username) => {
    if (username) {
        Logined[username] = undefined;
        delete Logined[username];
    } else
        throw new Error("Username or Userdata is Null");
}


module.exports.isLogined = (username) => {
    if (Logined.hasOwnProperty(username) && Logined[username]) {
        return Logined[username];
    }
    return null;
}