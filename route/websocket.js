const router = require('express')();

const varCenter = require('../model/VarCenter');
const {
    WebSocketObserver
} = require('../model/WebSocketModel');


const permssion = require('../helper/Permission');
const response = require('../helper/Response');
const counter = require('../core/counter');

var expressWs = require('express-ws')(router);


//WebSocket 创建
router.ws('/ws', function (ws, req) {

    let token = req.query[permssion.tokenName] || undefined;

    //无令牌，csrf
    if (!token) {
        counter.plus('csrfCounter');
        ws.close();
        return;
    }

    let username = undefined;
    let status = true;

    //临时的会话id  一般只用于内部验证是否是这个tcp链接
    let uid = "__" + permssion.randomString(12) + Date.parse(new Date()).toString() + "__";

    MCSERVER.log('[ WebSocket CREATE ] 新的 WebSocket 链接创建');

    //从令牌管理器中 获取对应的用户
    var tokens = varCenter.get('user_token');
    username = tokens[token];
    //权限判定
    if (!username || username == "") {
        MCSERVER.log('[ WebSocket INIT ]', '错误的令牌 [' + token + '] 尝试发起 Websocket 被拒绝');
        counter.plus('notPermssionCounter');
        ws.close();
        return;
    }

    //创建新的 Ws Session 类
    // var WsSession = _newWsSsession();
    var WsSession = new Object();
    WsSession.send = (data) => {
        response.wsSend(data.ws, data.resK, data.resV, data.body);
    }

    WsSession.login = (username && req.session['login']) ? true : false;
    WsSession.uid = uid;
    WsSession.ws = ws;
    WsSession.username = username;
    WsSession.token = token;
    WsSession.console = undefined;

    //放置全局在线列表
    MCSERVER.allSockets[uid] = WsSession;
    if (!MCSERVER.onlineUser[WsSession.username])
        MCSERVER.onlineUser[WsSession.username] = WsSession;


    MCSERVER.log('[ WebSocket INIT ]', ' 用户:', username, "与服务器建立链接");
    //数据到达
    ws.on('message', function (data) {

        //禁止未登陆用户进入
        if (!WsSession.login) {
            MCSERVER.log('[ WebSocket MSG ]', ' 未登陆用户尝试发起 Websocket 被拒绝');
            counter.plus('notPermssionCounter');
            return;
        };

        try {
            //在线用户计数器
            if (!MCSERVER.onlineUser[username]) {
                counter.plus('userOnlineCounter');
                MCSERVER.onlineUser[username] = WsSession;
            }

            //自定义协议数据解析
            let loc = data.indexOf('\n\n');
            let reqHeader = data.substr(0, loc);
            let reqBody = data.substr(loc + 2);
            let obj;
            let reqs = req;

            //Websocket 自定义协议解析
            reqHeaderObj = JSON.parse(reqHeader);
            if (!reqHeaderObj) return;

            WebSocketObserver().emit('ws/req', {
                ws: ws,
                req: req,
                user: username,
                header: reqHeaderObj,
                body: reqBody,
                RequestValue: reqHeaderObj['RequestValue'],
                token: token,
                WsSession: WsSession
            });
            //response.wsSend(ws, 'ws/res', true);
        } catch (err) {
            MCSERVER.error('WebSocket 处理此请求出现异常:', err);
        }
    });

    ws.on('close', function () {

        status = false;

        //释放一些数据
        delete varCenter.get('user_token')[token];
        // req.session['token'] = undefined;
        // req.session.save();
        delete WsSession;

        //释放全局变量
        if (MCSERVER.onlineUser[username]) {
            delete MCSERVER.onlineUser[username];
        }
        delete MCSERVER.allSockets[uid];
        MCSERVER.log('[ WebSocket CLOSE ]', '用户', username, '已经断开链接');
    });

});

const fs = require('fs');
//加载子路由
const {
    autoLoadModule
} = require("../core/tools");
autoLoadModule('route/websocket/', 'websocket/', (path) => {
    require(path);
});


//模块导出
module.exports = router;