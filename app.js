//运行时环境检测
try {
    let versionNum = parseInt(process.version.replace(/v/igm, "").split(".")[0]);
    if (versionNum < 8) {
        console.log("[ ERROR ] 您的 Node 运行环境版本似乎低于我们要求的版本.");
        console.log("[ ERROR ] 可能会出现未知异常,请立即更新 Node 版本 (>=8.0.0)");
    }
} catch (err) {
    //忽略任何版本检测导致的错误
}

const fs = require('fs');
const fsex = require('fs-extra');

//总全局变量
global.MCSERVER = {};

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

//各类层装载
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
    res.header('X-Soft', 'Mcserver Manager HTTP_SERVER');
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
    //打印出错误
    MCSERVER.error('UncaughtException 机制错误报告:', err);
});

//初始化目录结构环境
(function initializationRun() {
    const USERS_PATH = './users/';
    const SERVER_PATH = './server/';
    const SERVER_PATH_CORE = './server/server_core/';
    const CENTEN_LOG_JSON_PATH = './core/info.json';
    const PUBLIC_URL_PATH = './public/common/URL.js';

    try {
        if (!fs.existsSync(USERS_PATH)) fs.mkdirSync(USERS_PATH);
        if (!fs.existsSync(SERVER_PATH)) {
            fs.mkdir(SERVER_PATH, () => fs.mkdirSync(SERVER_PATH_CORE));
        }

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

//初始化模块
(function initializationProm() {

    counter.init();
    UserModel.userCenter().initUser();
    MCSERVER.infoLog('Module', '初始化 UserManager Module  ');


    ServerModel.ServerManager().loadALLMinecraftServer();
    MCSERVER.infoLog('Module', '初始化 ServerManager Module ');

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
    });


})();

//退出事件
let _endFlag = false;
process.on('SIGINT', function () {
    if (_endFlag) return;
    _endFlag = true;
    MCSERVER.infoLog('PROCESS', '程序正在结束,请稍等...'.red);

    //保存
    counter.save();
    ServerModel.ServerManager().saveAllMinecraftServer();
    UserModel.userCenter().saveAllUser();


    setTimeout(() => {
        MCSERVER.infoLog('PROCESS', 'EXIT...'.red);
        process.exit(0);
    }, 1000)
});