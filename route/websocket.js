const router = require('express')();
const fs = require('fs');

const varCenter = require('../model/VarCenter');
const {
    WebSocketObserver
} = require('../model/WebSocketModel');


const permssion = require('../helper/Permission');
const response = require('../helper/Response');
const loginedContainer = require('../helper/LoginedContainer');
const counter = require('../core/counter');

const expressWs = require('express-ws')(router);

//WebSocket 会话类
class WebsocketSession {
    constructor(config = {}) {
        this.login = config.login || false;
        this.uid = config.uid || null;
        this.ws = config.ws || null;
        this.username = config.username || null;
        this.token = config.token || null;
        this.console = config.console || null;
    }
    send(data) {
        if (data)
            response.wsSend(data.ws, data.resK, data.resV, data.body);
    }

    getWebsocket() {
        return this.ws || null;
    }
}

//判断当前令牌者是否在线
function isWsOnline(token) {
    for (let k in MCSERVER.allSockets) {
        let wsSession = MCSERVER.allSockets[k];
        if (wsSession.token == token) {
            return true;
        }
    }
    return false;
}


//WebSocket 创建
router.ws('/ws', function (ws, req) {

    let token = req.query[permssion.tokenName] || null;

    //无令牌
    if (!token) {
        counter.plus('csrfCounter');
        ws.close();
        return;
    }

    token = token.trim();
    let username = null;
    let status = true;

    //临时的会话id  一般只用于内部验证是否是这个tcp链接
    let uid = permssion.randomString(12) + Date.parse(new Date()).toString();
    let session_id = req.sessionID;

    MCSERVER.log('[ WS CREATE ] 新的 Ws 创建 SESSION_ID:' + session_id);

    //从令牌管理器中 获取对应的用户
    var tokens = varCenter.get('user_token');
    username = tokens[token] || null;

    //用户名检查
    if (!username || typeof username != "string" || username.trim() == "") {
        MCSERVER.warning('错误令牌的 WS 尝试建立链接 | 已经阻止', '用户值:' + username + ' 令牌值: ' + token);
        counter.plus('notPermssionCounter');
        ws.close();
        return;
    }

    //唯一性检查
    if (isWsOnline(token)) {
        MCSERVER.warning('此令牌正在使用 | 阻止重复使用', '用户值:' + username + ' 令牌值: ' + token);
        ws.close();
        return;
    }

    username = username.trim();

    //逻辑性缺陷检查
    if (!loginedContainer.isLogined(username)) {
        MCSERVER.warning('未经过登陆逻辑的用户尝试连接 | 已经阻止', '用户值:' + username + ' 令牌值: ' + token);
        ws.close();
        return;
    }

    //最后一层检查
    let WsSession = new WebsocketSession({
        //Ws 判断身份条件,必须在 token 管理器与 Session 中认证登录
        login: (username && req.session['login']) ? true : false,
        uid: uid,
        sessionID: session_id,
        ws: ws,
        username: username,
        token: token,
        console: null
    });


    //完全禁止没有登录的用户连接 ws 
    if (!WsSession.login) {
        MCSERVER.warning('不明身份者建立 ws 链接', '已经阻止 | 可能的用户值: ' + WsSession.username);
        counter.plus('notPermssionCounter');
        ws.close();
        return;
    }

    //放置全局在线列表
    MCSERVER.allSockets[uid] = WsSession;
    if (!MCSERVER.onlineUser[WsSession.username])
        MCSERVER.onlineUser[WsSession.username] = WsSession;


    MCSERVER.log('[ WebSocket INIT ]', ' 用户:', username, "与服务器建立链接");
    //数据到达
    ws.on('message', function (data) {
        try {

            //禁止未登陆用户进入
            if (!WsSession.login) {
                //触发这里代表极为有可能有人正在攻击你
                MCSERVER.warning('没有登录的用户正在尝试发送 Ws 命令', '已经阻止 | 可能的用户值: ' + username);
                counter.plus('notPermssionCounter');
                ws.close();
                return;
            }

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
        } catch (err) {
            MCSERVER.error('WebSocket 请求处理时异常:', err);
        }
    });

    ws.on('close', function () {

        status = false;

        //释放一些数据
        delete varCenter.get('user_token')[token];
        req.session['token'] = undefined;
        req.session.save();
        delete WsSession;

        //释放全局变量
        if (MCSERVER.onlineUser[username]) {
            delete MCSERVER.onlineUser[username];
        }
        delete MCSERVER.allSockets[uid];
        MCSERVER.log('[ WebSocket CLOSE ]', '用户', username, '已经断开链接');
    });

});

//加载 ws 子路由
require("../core/tools").autoLoadModule('route/websocket/', 'websocket/', (path) => {
    require(path);
});


//模块导出
module.exports = router;