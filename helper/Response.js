var querystring = require('querystring');

function send(res, info, value) {
    let str = JSON.stringify({
        'ResponseKey': info,
        'ResponseValue': value
    });

    try {
        res.send(str);
    } catch (e) {
        MCSERVER.log('一个HTTP响应报文发送失败:');
        MCSERVER.log(e);
    }
    // res.end();
}

function wsSend(ws, info, value, body = '') {

    let str = JSON.stringify({
        'ResponseKey': info,
        'ResponseValue': value
    });
    try {
        if (ws.readyState == ws.OPEN) {
            ws.send(str + '\n\n' + body || '');
        }
    } catch (e) {
        MCSERVER.log('一个Websocket数据包发送失败:');
        MCSERVER.log(e);
    }

    // ws.send(str);
}

module.exports.returnMsg = (res, info, value) => {
    send(res, info, value, undefined);
}

module.exports.returnInfo = (res, value) => {
    send(res, 'info/show', value);
}

module.exports.wsSend = (ws, info, value, body = '') => {
    wsSend(ws, info, value, body);
}

module.exports.wsMsgWindow = (ws, msg = '欢迎使用！') => {
    wsSend(ws, 'window/msg', {}, msg);
}