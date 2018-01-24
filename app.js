const express = require('express');
const fs = require('fs');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var querystring = require('querystring');
// var PSUtil = require('psutil').PSUtil;  //已舍弃

const serverModel = require('./model/ServerModel');
const UserModel = require('./model/UserModel');
const permission = require('./helper/Permission');
const response = require('./helper/Response');
const {
    randomString
} = require('./core/User/CryptoMine');
const counter = require('./core/counter');
const DataModel = require('./core/DataModel');
const ftpServerInterface = require('./ftpd/ftpserver');

const VarCenter = require('./model/VarCenter');
//控制台颜色
const colors = require('colors');

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'red',
    info: 'green',
    data: 'blue',
    help: 'cyan',
    warn: 'yellow',
    debug: 'magenta',
    error: 'red'
});

//logo输出
const LOGO_FILE_PATH = './core/logo.txt';
let data = fs.readFileSync(LOGO_FILE_PATH, 'utf-8');
console.log(data);

//总全局变量
global.MCSERVER = {};
//全局数据中心 记录 CPU 内存 
MCSERVER.dataCenter = {};

//装载log记录器
require('./core/log');

//全局设置
MCSERVER.softConfig = new DataModel('McserverConfig');
if (fs.existsSync('./McserverConfig.json')) {
    MCSERVER.softConfig.load();
} else {
    //初始化
    MCSERVER.softConfig.ip = '';
    MCSERVER.softConfig.port = 23333;
    MCSERVER.softConfig.FTP_port = 10021;
    MCSERVER.softConfig.FTP_ip = '';
    MCSERVER.softConfig.save();
}

//全局登陆记录器
MCSERVER.login = {};
//全局 在线用户监视器
MCSERVER.onlineUser = {};
//全局 在线 Websocket 监视器
MCSERVER.allSockets = {};
//全局 token 记录器 /
MCSERVER.tokens = {};
//全局 数据内存记录器
MCSERVER.logCenter = {};

// MCSERVER.logCenter.CPU = [];
// MCSERVER.logCenter.RAM = [];
//init
MCSERVER.logCenter.initLogData = (objStr, len, def = null) => {
    let tmp = [];
    for (let i = 0; i < len; i++) tmp.push(def);
    MCSERVER.logCenter[objStr] = tmp;
}
//压入方法
MCSERVER.logCenter.pushLogData = (objStr, k, v) => {
    MCSERVER.logCenter[objStr] = MCSERVER.logCenter[objStr].slice(1);
    MCSERVER.logCenter[objStr].push({
        'key': k,
        'val': v
    });
}

//获取最新咨询
require('./model/requestNews');

//exp 框架
var app = express();
//web Socket 框架
var expressWs = require('express-ws')(app);

//Cookie and Session 的基础功能
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'Mcserver_w2j4o_7_er_idwih',
    name: 'Mcserver_session',
    cookie: {
        maxAge: 10000 * 60 * 60 * 3
    }, // 3 小时
    resave: true,
    saveUninitialized: true,
}));

//初始化令牌管理器  已弃用 向下兼容
VarCenter.set('user_token', {});
VarCenter.set('express_app', app);

//基础根目录
app.use('/public', express.static('./public'));


// console 中间件挂载
app.use((req, res, next) => {
    console.log('[', req.protocol.green, req.httpVersion.green, req.method.cyan, ']', req.originalUrl);
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header('Access-Control-Allow-Methods', 'GET, POST');
    // res.header("Access-Control-Allow-Headers", "X-Requested-With");
    // res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('X-Soft', 'Mcserver Manager HTTP_SERVER');
    res.header('X-Frame-Options', 'DENY');
    next();
});


//基础的根目录路由
app.get(['/login', '/l', '/', '/logined'], function (req, res) {
    permission.needLogin(req, res, () => {
        res.redirect('/public/#welcome');
    }, () => {
        res.redirect('/public/login/');
    });
});

//自动装载所有路由
let routeList = fs.readdirSync('./route/');
for (let key in routeList) {
    let name = routeList[key].replace('.js', '');
    app.use('/' + name, require('./route/' + name));
}

process.on("uncaughtException", function (err) {
    //打印出错误
    MCSERVER.error('UncaughtException 机制错误报告:', err);
});

//初始化目录结构环境
(function initializationRun() {
    const USERS_PATH = './users/';
    const SERVER_PATH = './server/';
    const SERVER_PATH_CORE = './server/server_core/';
    const CENTEN_LOG_JSON_PATH = './core/info.json';
    try {
        if (!fs.existsSync(USERS_PATH)) fs.mkdirSync(USERS_PATH);
        if (!fs.existsSync(SERVER_PATH)) {
            fs.mkdir(SERVER_PATH, () => fs.mkdirSync(SERVER_PATH_CORE));
        }
        if (!fs.existsSync(CENTEN_LOG_JSON_PATH)) {
            let resetData = fs.readFileSync('./core/info_reset.json', {
                encoding: 'UTF-8'
            });
            fs.writeFileSync('./core/info.json', resetData, {
                encoding: 'UTF-8'
            });
        }
    } catch (err) {
        MCSERVER.error('初始化文件环境失败,建议重启,请检查以下报错:', err);
    }
})();

MCSERVER.infoLog('Online_Fs', '初始化 Online_Fs 路由与中间件 ');

//必须先进行登陆 且 fs API 请求必须为 Ajax 请求，得以保证跨域阻止
app.use(['/fs/mkdir', '/fs/rm', '/fs/patse', '/fs/cp', '/fs/rename', '/fs/ls'], function (req, res, next) {
    if (req.session.fsos && req.xhr) {
        next();
        return;
    }
    res.status(403).send('禁止访问:权限不足！您不能直接访问文件在线管理程序 API，请通过正常流程！');
});
//载入在线文件管理路由
app.use('/fs_auth', require('./onlinefs/controller/auth'));
app.use('/fs', require('./onlinefs/controller/function'));


(function initializationProm() {

    counter.init();
    UserModel.userCenter().initUser();
    MCSERVER.infoLog('Module', '初始化 UserManager Module  ');


    serverModel.ServerManager().loadALLMinecraftServer();
    MCSERVER.infoLog('Module', '初始化 ServerManager Module ');

    var host = MCSERVER.softConfig.ip;
    var port = MCSERVER.softConfig.port;

    if (host == '::')
        host = '127.0.0.1';

    app.listen(MCSERVER.softConfig.port, MCSERVER.softConfig.ip, () => {
        //App Http listen

        MCSERVER.infoLog('HTTP', 'HTTP 模块监听: [ http://' + (host || '127.0.0.1'.yellow) + ':' + port + ' ]');

        //现在执行 FTP 服务器启动过程
        ftpServerInterface.initFTPdServerOptions({
            host: MCSERVER.softConfig.FTP_ip || '127.0.0.1',
            port: MCSERVER.softConfig.FTP_port,
            tls: null
        });

        //执行ftp逻辑
        require('./ftpd/index');

    });

})();