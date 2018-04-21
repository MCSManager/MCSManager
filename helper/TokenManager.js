const baseManagerModel = require('../model/baseManagerModel');


let onlyTokenManager = new baseManagerModel.ModelManager();


module.exports.addToken = (key, value) => {
    if (onlyTokenManager.len >= 20) {
        //TOken 请求最大等待队列长度,超过则统一删除
        onlyTokenManager.clear();
    }
    onlyTokenManager.add(key, value);
}


module.exports.delToken = (key, value) => {
    onlyTokenManager.del(key, value);
}



module.exports.getToken = (key) => {
    return onlyTokenManager.get(key);
}