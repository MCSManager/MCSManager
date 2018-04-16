const {
    USER_SAVE_PATH,
    User
} = require('../core/User/User');

const UserCenter = require('../core/User/UserCenter');
const fs = require('fs');

let userCenters = new UserCenter();
module.exports.userCenter = () => {
    return userCenters;
}

module.exports.registerUser = (username, password) => {
    return userCenters.register(username, password);
}


module.exports.loginUser = (username, password, truecb, falsecb, enkey) => {
    return userCenters.loginCheck(username, password, truecb, falsecb, enkey, false);
}

module.exports.beliveLogin = (username, password, truecb, falsecb) => {
    return userCenters.loginCheck(username, password, truecb, falsecb, null, true);
}


module.exports.deleteUser = (username, truecb, falsecb) => {
    try {
        if (userCenters.deleteUser(username)) {
            truecb && truecb();
            return;
        }
        falsecb && falsecb();
    } catch (e) {
        MCSERVER.log(e);
        falsecb && falsecb();
    }
    return false;
}

module.exports.reAllowedServer = (username, list) => {
    return userCenters.get(username)
        .allowedServer(list)
        .save();
}