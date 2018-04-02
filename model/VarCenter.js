//全局用户 token 保存区
global.__MCSERVER_VAR_LIST__ = {};


module.exports.set = (key, value) => {
    global.__MCSERVER_VAR_LIST__[key] = value;
}


module.exports.get = (key, def = undefined) => {
    return global.__MCSERVER_VAR_LIST__[key] || def;
}