var _VAR_LIST = {};


module.exports.set = (key, value) => {
    _VAR_LIST[key] = value;
}


module.exports.get = (key, def = undefined) => {
    return _VAR_LIST[key] || def;
}