const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const counter = require('../../core/counter');
const tools = require('../../core/tools');
const response = require('../../helper/Response');

const serverModel = require('../../model/ServerModel');
const permssion = require('../../helper/Permission');
const userModel = require('../../model/UserModel');
const os = require("os");

const mversion = require('../../helper/version');

const MB_SIZE = 1024 * 1024;
let serverM = serverModel.ServerManager();
let userM = userModel.userCenter();

//设置要定时清除的数据
counter.initData(() => {
    counter.set('notPermssionCounter', 0);
    counter.set('login', 0);
    counter.set('maybeLogin', 0);
    counter.set('passwordError', 0);
    counter.set('csrfCounter', 0);
});


// var pusage = require('pidusage');
// //CPU
// //需要刷新的CPU
// var cacheCPU = 0;
// setInterval(() => {
//     pusage.stat(process.pid, function(err, stat) {
//         cacheCPU = stat.cpu.toFixed(1);
//     })
// }, 3000);


const osUtils = require('os-utils');
//系统CPU
var cacheCPU = 0;
let cacheSystemInfo = null;
let usage = process.memoryUsage();

//init 记录器
MCSERVER.logCenter.initLogData('CPU', 16);
MCSERVER.logCenter.initLogData('RAM', 16);

//实不相瞒，其实我是弄的缓存
setInterval(function () {
    osUtils.cpuUsage(function (v) {
        // console.log('CPU Usage (%): ' + v * 100);
        cacheCPU = (v * 100).toFixed(2);
        MCSERVER.dataCenter.cacheCPU = cacheCPU;
    });
    let onliec = 0;
    let sockec = 0;
    let banipc = 0;
    //统计在线用户
    for (let k in MCSERVER.onlineUser) {
        if (MCSERVER.onlineUser[k] == null) continue;
        onliec++
    }
    //统计在线 Ws
    for (let k in MCSERVER.allSockets) {
        if (MCSERVER.allSockets[k] == null) continue;
        sockec++
    }
    //统计封号ip数量
    for (let k in MCSERVER.login) MCSERVER.login[k] > 10 ? banipc++ : banipc = banipc;

    //缓存值
    cacheSystemInfo = {
        rss: (usage.rss / MB_SIZE).toFixed(1),
        heapTotal: (usage.heapTotal / MB_SIZE).toFixed(1),
        heapUsed: (usage.heapUsed / MB_SIZE).toFixed(1),
        sysTotalmem: (os.totalmem() / MB_SIZE).toFixed(1),
        sysFreemem: (os.freemem() / MB_SIZE).toFixed(1),
        cpu: cacheCPU,
        uptime: os.uptime(),
        //more
        serverCounter: serverM.getServerCounter(),
        runServerCounter: serverM.getRunServerCounter(),
        userCounter: userM.getUserCounter(),
        userOnlineCounter: onliec,
        WebsocketCounter: sockec,
        loginCounter: counter.get('login'), //登陆次数
        banip: banipc, //封的ip
        passwordError: counter.get('passwordError'), //密码错误次数
        csrfCounter: counter.get('csrfCounter'), //可能存在的CSRF攻击次数
        notPermssionCounter: counter.get('notPermssionCounter'), //API的无权访问
        root: mversion.root,
        oneversion: mversion.oneversion,
        twoversion: mversion.twoversion,
        system: mversion.system
    }

    let useMemBai = ((os.freemem() / 1024) / (os.totalmem() / 1024) * 100).toFixed(0);
    //压入记录器
    MCSERVER.logCenter.pushLogData('CPU', tools.getMineTime(), parseInt(cacheCPU));
    MCSERVER.logCenter.pushLogData('RAM', tools.getMineTime(), 100 - useMemBai);

    // console.log(MCSERVER.logCenter.RAM)

    setTimeout(() => counter.save(), 0); //让其异步的去保存
}, MCSERVER.localProperty.data_center_times);


//数据中心
WebSocketObserver().listener('center/show', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;
    response.wsSend(data.ws, 'center/show', cacheSystemInfo);
});