//运行时环境检测
try {
    let versionNum = parseInt(process.version.replace(/v/igm, "").split(".")[0]);
    //尽管我们建议最低版本为 v10 版本
    if (versionNum < 10) {
        console.log("[ WARN ] 您的 Node 运行环境版本似乎低于我们要求的版本.");
        console.log("[ WARN ] 可能会出现未知情况,建议您更新 Node 版本 (>=10.0.0)");
    }
} catch (err) {
    //忽略任何版本检测导致的错误
}

//全局变量 MCSERVER
global.MCSERVER = {};

//测试时检测
MCSERVER.allError = 0;
//自动化部署测试
setTimeout(() => {
    let arg2 = process.argv[2] || '';
    if (arg2 == '--test') {
        MCSERVER.infoLog("Test", "测试过程结束...");
        if (MCSERVER.allError > 0) {
            MCSERVER.infoLog("Test", "测试未通过!");
            process.exit(500);
        }
        MCSERVER.infoLog("Test", "测试通过!");
        process.exit(0);
    }
}, 10000);

const fs = require('fs');
const fsex = require('fs-extra');

//全局仅限本地配置
MCSERVER.localProperty = {};

const tools = require('./core/tools');

//生成第一次配置文件
const INIT_CONFIG_PATH = './model/init_config/';
const PRO_CONFIG = './property.js';
if (!fs.existsSync(PRO_CONFIG))
    tools.mCopyFileSync(INIT_CONFIG_PATH + 'property.js', PRO_CONFIG);

//加载配置
require('./property');


const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const querystring = require('querystring');
//gzip压缩
const compression = require('compression');

//各类层装载 与 初始化
const ServerModel = require('./model/ServerModel');
const UserModel = require('./model/UserModel');
const permission = require('./helper/Permission');
const response = require('./helper/Response');
const {
    randomString
} = require('./core/User/CryptoMine');
const counter = require('./core/counter');
const DataModel = require('./core/DataModel');
const ftpServerInterface = require('./ftpd/ftpserver');
const tokenManger = require('./helper/TokenManager');
const nodeSchedule = require("node-schedule");
const Schedule = require('./helper/Schedule');
const NewsCenter = require('./model/NewsCenter');

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

//全局数据中心 记录 CPU 内存 
MCSERVER.dataCenter = {};

//装载log记录器
require('./core/log');

//全局登陆记录器
MCSERVER.login = {};
//全局 在线用户监视器
MCSERVER.onlineUser = {};
//全局 在线 Websocket 监视器
MCSERVER.allSockets = {};
//全局 数据内存记录器
MCSERVER.logCenter = {};
//PAGE 页面数据储存器
MCSERVER.PAGE = {};

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

var UUID = require('uuid');
app.use(session({
    secret: UUID.v4(),
    name: 'MCSM_SESSION_ID',
    cookie: {
        maxAge: MCSERVER.localProperty.session_max_age * 1000 * 60
    },
    resave: false,
    saveUninitialized: false
}));

//使用 gzip 静态文本压缩，但是如果你使用反向代理或某 HTTP 服务自带的gzip，请关闭它
if (MCSERVER.localProperty.is_gzip)
    app.use(compression());

//基础根目录
app.use('/public', express.static('./public'));


// console 中间件挂载
app.use((req, res, next) => {
    console.log('[', req.protocol.green, req.method.cyan, ']', req.originalUrl);
    if (MCSERVER.localProperty.is_allow_csrf) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET, POST');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    res.header('X-Frame-Options', 'DENY');
    next();
});


//基础的根目录路由
app.get(['/login', '/l', '/', '/logined'], function (req, res) {
    permission.needLogin(req, res, () => {
        res.redirect('/public/#welcome');
    }, () => {
        res.redirect(MCSERVER.localProperty.login_url);
    });
});

//自动装载所有路由
let routeList = fs.readdirSync('./route/');
for (let key in routeList) {
    let name = routeList[key].replace('.js', '');
    app.use('/' + name, require('./route/' + name));
}

process.on("uncaughtException", function (err) {
    //是否出过错误,本变量用于自动化测试
    MCSERVER.allError++;
    //打印出错误
    MCSERVER.error('错误报告:', err);
});

process.on('unhandledRejection', (reason, p) => {
    MCSERVER.infoLog('错误报告:');
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

//初始化目录结构环境
(function initializationRun() {
    const USERS_PATH = './users/';
    const SERVER_PATH = './server/';
    const SERVER_PATH_CORE = './server/server_core/';
    const SERVER_PATH_SCH = './server/schedule/';
    const CENTEN_LOG_JSON_PATH = './core/info.json';
    const PUBLIC_URL_PATH = './public/common/URL.js';
    const RECORD_PARH = './server/record_tmp/'

    try {
        if (!fs.existsSync(USERS_PATH)) fs.mkdirSync(USERS_PATH);
        if (!fs.existsSync(SERVER_PATH)) fs.mkdirSync(SERVER_PATH);
        if (!fs.existsSync(SERVER_PATH_CORE)) fs.mkdirSync(SERVER_PATH_CORE);
        if (!fs.existsSync(SERVER_PATH_SCH)) fs.mkdirSync(SERVER_PATH_SCH);
        if (!fs.existsSync(RECORD_PARH)) fs.mkdirSync(RECORD_PARH);

        // 生成不 git 同步的文件
        if (!fs.existsSync(CENTEN_LOG_JSON_PATH))
            tools.mCopyFileSync(INIT_CONFIG_PATH + 'info_reset.json', CENTEN_LOG_JSON_PATH);
        if (!fs.existsSync(PUBLIC_URL_PATH))
            tools.mCopyFileSync(INIT_CONFIG_PATH + 'INIT_URL.js', PUBLIC_URL_PATH);

    } catch (err) {
        MCSERVER.error('初始化文件环境失败,建议重启,请检查以下报错:', err);
    }
})();

//开始对 Oneline File Manager 模块进行必要的初始化
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

//初始化各个模块
(function initializationProm() {

    MCSERVER.infoLog('Module', '正在初始化用户管理模块');
    counter.init();
    UserModel.userCenter().initUser();

    MCSERVER.infoLog('Module', '正在初始化服务端管理模块');
    ServerModel.ServerManager().loadALLMinecraftServer();

    MCSERVER.infoLog('Module', '正在初始化计划任务模块');
    Schedule.init();

    var host = MCSERVER.localProperty.http_ip;
    var port = MCSERVER.localProperty.http_port;

    if (host == '::')
        host = '127.0.0.1';

    //App Http listen
    app.listen(MCSERVER.localProperty.http_port, MCSERVER.localProperty.http_ip, () => {

        MCSERVER.infoLog('HTTP', 'HTTP 模块监听: [ http://' + (host || '127.0.0.1'.yellow) + ':' + port + ' ]');

        //现在执行 FTP 服务器启动过程
        ftpServerInterface.initFTPdServerOptions({
            host: MCSERVER.localProperty.ftp_ip || '127.0.0.1',
            port: MCSERVER.localProperty.ftp_port,
            tls: null
        });

        if (MCSERVER.localProperty.ftp_is_allow)
            require('./ftpd/index'); //执行ftp逻辑

        MCSERVER.infoLog('INFO', '配置文件: property.js 文件');
        MCSERVER.infoLog('INFO', '文档参阅: https://github.com/suwings/mcsmanager');

        if (MCSERVER.allError <= 0) {
            MCSERVER.infoLog('INFO', '控制面板已经启动');
        } else {
            MCSERVER.infoLog('INFO', '控制面板启动异常');
        }
    });


})();


//用于捕捉前方所有路由都未经过的请求，则可为 404 页面
app.get('*', function (req, res) {
    //404 页面
    res.redirect('/public/template/404_page.html');
    res.end();
})


//设置定时获取最新新闻动态
//这里是每23小时59分59秒更新一次
nodeSchedule.scheduleJob('59 59 */23 * * * ', function () {
    MCSERVER.infoLog('INFO', '自动更新新闻动态与最新消息');
    NewsCenter.requestNews();
});
//重启自动获取一次
NewsCenter.requestNews();


//程序退出信号处理
require('./core/procexit');
