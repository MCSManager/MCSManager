const { WebSocketObserver } = require('../../model/WebSocketModel');
const permssion = require('../../helper/Permission');
const response = require('../../helper/Response');


WebSocketObserver().listener('menu', (data) => {
    //Object {ws: WebSocket, req: IncomingMessage, user: undefined, header: Object, body: "[body 开始]
    //Object {RequestKey: "req", RequestValue: "some"}

    if (data.WsSession.login == false) {
        response.wsMsgWindow(data.ws, '身份信息丢失，请重新登陆补全身份信息');
        return;
    }
    response.wsSend(data.ws, 'ws/muem', {
        username: data.WsSession.username,
    });
    response.wsMsgWindow(data.ws, '欢迎上线 ' + data.WsSession.username);
    //判断是否是管理员
    // if (!permssion.isMaster(data.WsSession, false)) {
    //     //普通
    //     response.wsSend(data.ws, 'ws/muem', {
    //         username: data.WsSession.username,
    //         items: [{
    //             class: 'glyphicon-home',
    //             name: '用户中心',
    //             link: './template/gen_home.html',
    //             api: 'genuser/home'
    //         }, {
    //             class: 'glyphicon-equalizer',
    //             name: '技术支持',
    //             link: './template/gen_about.html',
    //             api: null
    //         }, ]
    //     });

    // } else {

    //     //管理
    //     response.wsSend(data.ws, 'ws/muem', {
    //         username: data.WsSession.username,
    //         items: [{
    //             class: 'glyphicon-home',
    //             name: '控制面板首页',
    //             link: './template/index.html',
    //             api: 'index/update'
    //         }, {
    //             class: 'glyphicon-equalizer',
    //             name: '监控数据中心',
    //             link: './template/center.html',
    //             api: 'center/show'
    //         }, {
    //             class: 'glyphicon-tasks',
    //             name: '服务端管理',
    //             link: './template/server.html',
    //             api: 'server/view'
    //         }, {
    //             class: 'glyphicon-th-large',
    //             name: '用户权限设定',
    //             link: './template/userset.html',
    //             api: 'userset/update'
    //         }, {
    //             class: 'glyphicon-cog',
    //             name: '控制面板设置',
    //             link: './template/softset.html',
    //             api: 'soft/view'
    //         }, {
    //             class: 'glyphicon-floppy-open',
    //             name: '客户支持',
    //             link: './template/feelback.html',
    //             api: null
    //         }]
    //     });
    // }

});