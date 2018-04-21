const baseManagerModel = require('../model/baseManagerModel');


let onlyTokenManager = new baseManagerModel.ModelManager();


module.exports.addToken = (key, value) => {
    if (onlyTokenManager.len > 100) {
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