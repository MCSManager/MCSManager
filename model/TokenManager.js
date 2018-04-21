//全局用户 token 保存区
global.__MCSERVER_VAR_LIST__ = {};


module.exports.set = (key, value) => {
    if (key)
        global.__MCSERVER_VAR_LIST__[key] = value;
    else
        throw new Error("key is undefined")
}


module.exports.get = (key, def = undefined) => {
    if (key)
        return global.__MCSERVER_VAR_LIST__[key] || def;
    else
        throw new Error("key is undefined")
}