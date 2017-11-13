const DataModel = require('./DataModel');

var dataModel = new DataModel('core/info');
var counterMask = {};
var initDataCallbackList = [];

module.exports.initData = (callback) => {
    initDataCallbackList.push(callback);
}


module.exports.init = () => {
    module.exports.load();
    //定时清楚
    setInterval(function() {
        if (new Date().getDate() == 1 && (new Date().getMonth() + 1) >= dataModel.reloadMonth) {
            dataModel.reloadMonth = (new Date().getMonth() + 2); //调至下个月
            MCSERVER.log(' ---- 数据期限已到 清空数据统计 ---- ');
            for (let i in initDataCallbackList) {
                initDataCallbackList[i]();
            }
            module.exports.save();
        }
    }, 10000);
}


module.exports.load = () => {
    dataModel.load();
    counterMask = dataModel.counterData;
    if (dataModel.reloadMonth == undefined) dataModel.reloadMonth = new Date().getMonth() + 2; //下个月
    dataModel.save();
    return this;
}

module.exports.save = () => {
    dataModel.counterData = counterMask;
    dataModel.save();
    return this;
}

module.exports.plus = (event) => {
    if (counterMask[event] != undefined) {
        counterMask[event]++;
    } else {
        counterMask[event] = 1;
    }
    return this;
}

module.exports.minus = (event) => {
    if (counterMask[event] != undefined) {
        counterMask[event]--;
    } else {
        counterMask[event] = 1;
    }
    return this;
}

module.exports.set = (event, value) => {
    counterMask[event] = value;
    return this;
}

module.exports.get = (event) => {
    if (counterMask[event] != undefined) {
        return counterMask[event];
    }
    return 0;
}

module.exports.add = (event, value) => {
    if (counterMask[event] != undefined) {
        counterMask[event] += value;
    } else {
        counterMask[event] = 1;
    }
    return this;
}