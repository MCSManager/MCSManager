const EventEmitter = require('events');
const observerModel = require('./ObserverModel');
// class WebSocketObserver extends EventEmitter {

// }


// var onlyWebSocketObserver = new WebSocketObserver();

//事件二次转发  监听ws/req即可监听所有Websocket请求
observerModel.listener('ws/req', '', (data) => {
    let event = data.RequestValue;
    observerModel.emit(event, data);
});

module.exports.WebSocketObserver = () => {
    return observerModel;
}