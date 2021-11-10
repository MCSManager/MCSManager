/*
 * ==================================
 * Copyright(c) 2021 https://github.com/Suwings.
 * MIT Licensed
 *
 * 欢迎阅读:
 * 您现在看见的这份代码为 MCSManager 8.X 版本代码，此版本已是落后版本。
 * 您可以来此处了解最新版本：https://github.com/Suwings/MCSManager
 * 但这不代表此代码毫无价值，它依然有基本的功能。
 * 不过，这份代码将不再进行任何更新与维护，纵使发现漏洞缺陷，纵使拥有严重的错误缺陷，也不再修复。
 * 它的使命已经完成。现在，您可以压榨它的剩余价值，以便于更好的服务于您。
 * 或者，服务下一位，直到 Minecraft 消失，计算机换代更新，人类文明结束，它也许还会存在。
 *
 * 根据 MIT 开源协议发行:
 * 此软件源代码与相关文档对所有人免费，可以任意处置，包括使用，复制，修改，合并，发表，分发，再授权，或者销售。
 * 唯一的限制是，软件中必须包含版权说明和许可提示。
 *
 * 只适用于中国市场:
 * 本程序无英文版，有且只有中文版。
 *
 * 历史遗留:
 * 此程序源代码经历了 2013 年到 2021 年，代码中会有一些古老的语法与实现方式。
 * 某些地方如果您不知道为何这样写，那么切勿改动。
 *
 *
 * Google translate:
 * The code you see now is the MCSManager 8.X version code, which is already a backward version.
 * You can check the latest version here: https://github.com/Suwings/MCSManager
 * But this does not mean that this code is worthless, it still has basic functions.
 * However, this code will no longer be updated and maintained, even if vulnerabilities are found, even if there are serious bugs and defects, it will no longer be repaired.
 * Its mission has been completed. Now, you can squeeze its remaining value in order to better serve you.
 * Or, serve the next one, until Minecraft disappears, the computer is updated and the human civilization ends, it may still exist.
 *
 * Released under the MIT open source agreement:
 * The source code of this software and related documents are free to everyone and can be disposed of at will, including use, copy, modify, merge, publish, distribute, sublicense, or sell.
 * The only restriction is that the software must contain copyright notices and license hints.
 *
 * Only applicable to the Chinese market:
 * There is no English version of this program, and only Chinese version.
 *
 * Historical legacy:
 * The source code of this program has gone through from 2013 to 2021, and there will be some ancient syntax and implementation methods in the code.
 * In some places, if you don't know why it is written this CODE, please don't change it.
 * ==================================
 */

// 软件终端图标输出
console.log(`______  _______________________  ___                                         
___   |/  /_  ____/_  ___/__   |/  /_____ _____________ _______ _____________
__  /|_/ /_  /    _____ \\__  /|_/ /_  __  /_  __ \\  __  /_  __  /  _ \\_  ___/
_  /  / / / /___  ____/ /_  /  / / / /_/ /_  / / / /_/ /_  /_/ //  __/  /    
/_/  /_/  \\____/  /____/ /_/  /_/  \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/     
                                                        /____/             
 + Copyright Suwings All rights reserved.
 + Version 8.7 Final Edition
`);

// 运行时环境检测
try {
  let versionNum = parseInt(process.version.replace(/v/gim, "").split(".")[0]);
  // 尽管我们建议最低版本为 v10 版本
  if (versionNum < 10) {
    console.log("[ WARN ] 您的 Node 运行环境版本似乎低于我们要求的版本.");
    console.log("[ WARN ] 可能会出现未知情况,建议您更新 Node 版本 (>=10.0.0)");
  }
} catch (err) {
  // 忽略任何版本检测导致的错误
}

// 全局变量 MCSERVER
global.MCSERVER = {};

// 测试时检测
MCSERVER.allError = 0;
// 自动化部署测试
setTimeout(() => {
  let arg2 = process.argv[2] || "";
  if (arg2 == "--test") {
    MCSERVER.infoLog("Test", "测试过程结束...");
    if (MCSERVER.allError > 0) {
      MCSERVER.infoLog("Test", "测试未通过!");
      process.exit(500);
    }
    MCSERVER.infoLog("Test", "测试通过!");
    process.exit(0);
  }
}, 10000);

const fs = require("fs");

// 全局仅限本地配置
MCSERVER.localProperty = {};

const tools = require("./core/tools");

// 生成第一次配置文件
const INIT_CONFIG_PATH = "./model/init_config/";
const PRO_CONFIG = "./property.js";
if (!fs.existsSync(PRO_CONFIG)) tools.mCopyFileSync(INIT_CONFIG_PATH + "property.js", PRO_CONFIG);

// 加载配置
require("./property");

const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const querystring = require("querystring");
// gzip压缩
const compression = require("compression");

// 各类层装载 与 初始化
const ServerModel = require("./model/ServerModel");
const UserModel = require("./model/UserModel");
const permission = require("./helper/Permission");
const response = require("./helper/Response");
const { randomString } = require("./core/User/CryptoMine");
const counter = require("./core/counter");
const DataModel = require("./core/DataModel");
const tokenManger = require("./helper/TokenManager");
const nodeSchedule = require("node-schedule");
const Schedule = require("./helper/Schedule");
const NewsCenter = require("./model/NewsCenter");

// 控制台颜色
const colors = require("colors");
colors.setTheme({
  silly: "rainbow",
  input: "grey",
  verbose: "cyan",
  prompt: "red",
  info: "green",
  data: "blue",
  help: "cyan",
  warn: "yellow",
  debug: "magenta",
  error: "red",
});

// 全局数据中心 记录 CPU 内存
MCSERVER.dataCenter = {};

// 装载log记录器
require("./core/log");
MCSERVER.info("控制面板正在启动中...");

// 全局登陆记录器
MCSERVER.login = {};
// 全局 在线用户监视器
MCSERVER.onlineUser = {};
// 全局 在线 Websocket 监视器
MCSERVER.allSockets = {};
// 全局 数据内存记录器
MCSERVER.logCenter = {};
// PAGE 页面数据储存器
MCSERVER.PAGE = {};

// 计数数据：初始化方法
MCSERVER.logCenter.initLogData = (objStr, len, def = null) => {
  let tmp = [];
  for (let i = 0; i < len; i++) tmp.push(def);
  MCSERVER.logCenter[objStr] = tmp;
};

// 计数数据：压入方法
MCSERVER.logCenter.pushLogData = (objStr, k, v) => {
  MCSERVER.logCenter[objStr] = MCSERVER.logCenter[objStr].slice(1);
  MCSERVER.logCenter[objStr].push({
    key: k,
    val: v,
  });
};

// 初始化 Express 框架
var app = express();
// 初始化 Express-WebSocket 框架
var expressWs = require("express-ws")(app);

// 初始化 Cookie and Session 的基础功能
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

// 初始化 Session 功能
var UUID = require("uuid");
app.use(
  session({
    secret: UUID.v4(),
    name: "MCSM_SESSION_ID",
    cookie: {
      maxAge: MCSERVER.localProperty.session_max_age * 1000 * 60,
    },
    resave: false,
    saveUninitialized: false,
  })
);

// 使用 gzip 静态文本压缩，但是如果你使用反向代理或某 HTTP 服务自带的gzip，请关闭它
if (MCSERVER.localProperty.is_gzip) app.use(compression());

// 设置静态文件基础根目录
app.use("/public", express.static("./public"));

// console 中间件挂载
app.use((req, res, next) => {
  // 部分请求不必显示
  if (req.originalUrl.indexOf("/api/") == -1 && req.originalUrl.indexOf("/fs/") == -1 && req.originalUrl.indexOf("/fs_auth/") == -1 && req.originalUrl.indexOf("/fs_auth/") == -1) {
  }
  if (MCSERVER.localProperty.is_allow_csrf) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
  }
  res.header("X-Frame-Options", "DENY");
  next();
});

// 初始化基础的根目录路由
app.get(["/login", "/l", "/", "/logined"], function (req, res) {
  permission.needLogin(
    req,
    res,
    () => {
      res.redirect("/public/#welcome");
    },
    () => {
      res.redirect(MCSERVER.localProperty.login_url);
    }
  );
});

// 自动装载所有路由
let routeList = fs.readdirSync("./route/");
for (let key in routeList) {
  let name = routeList[key].replace(".js", "");
  app.use("/" + name, require("./route/" + name));
}

process.on("uncaughtException", function (err) {
  // 是否出过错误,本变量用于自动化测试
  MCSERVER.allError++;
  // 打印出错误
  MCSERVER.error("错误报告:", err);
});

process.on("unhandledRejection", (reason, p) => {
  MCSERVER.error("错误报告:", reason);
});

// 初始化目录结构环境
(function initializationRun() {
  const USERS_PATH = "./users/";
  const SERVER_PATH = "./server/";
  const SERVER_PATH_CORE = "./server/server_core/";
  const SERVER_PATH_SCH = "./server/schedule/";
  const CENTEN_LOG_JSON_PATH = "./core/info.json";
  const PUBLIC_URL_PATH = "./public/common/URL.js";
  const RECORD_PARH = "./server/record_tmp/";

  try {
    if (!fs.existsSync(USERS_PATH)) fs.mkdirSync(USERS_PATH);
    if (!fs.existsSync(SERVER_PATH)) fs.mkdirSync(SERVER_PATH);
    if (!fs.existsSync(SERVER_PATH_CORE)) fs.mkdirSync(SERVER_PATH_CORE);
    if (!fs.existsSync(SERVER_PATH_SCH)) fs.mkdirSync(SERVER_PATH_SCH);
    if (!fs.existsSync(RECORD_PARH)) fs.mkdirSync(RECORD_PARH);

    // 生成不 git 同步的文件
    if (!fs.existsSync(CENTEN_LOG_JSON_PATH)) tools.mCopyFileSync(INIT_CONFIG_PATH + "info_reset.json", CENTEN_LOG_JSON_PATH);
    if (!fs.existsSync(PUBLIC_URL_PATH)) tools.mCopyFileSync(INIT_CONFIG_PATH + "INIT_URL.js", PUBLIC_URL_PATH);
  } catch (err) {
    MCSERVER.error("初始化文件环境失败,建议重启,请检查以下报错:", err);
  }
})();

// 开始对 File Manager 模块进行必要的初始化
MCSERVER.infoLog("OnlineFs", "正在初始化文件管理路由与中间件 ");

// 必须先进行登陆 且 fs API 请求必须为 Ajax 请求，得以保证跨域阻止
app.use(["/fs/mkdir", "/fs/rm", "/fs/patse", "/fs/cp", "/fs/rename", "/fs/ls"], function (req, res, next) {
  if (req.session.fsos && req.xhr) {
    next();
    return;
  }
  res.status(403).send("禁止访问:权限不足！您不能直接访问文件在线管理程序 API，请通过正常流程！");
});

// 载入在线文件管理路由
app.use("/fs_auth", require("./onlinefs/controller/auth"));
app.use("/fs", require("./onlinefs/controller/function"));

// 初始化各个模块
(function initializationProm() {
  MCSERVER.infoLog("Module", "正在初始化用户管理模块");
  counter.init();
  UserModel.userCenter().initUser();

  MCSERVER.infoLog("Module", "正在初始化服务端管理模块");
  ServerModel.ServerManager().loadALLMinecraftServer();

  MCSERVER.infoLog("Module", "正在初始化计划任务模块");
  Schedule.init();

  var host = MCSERVER.localProperty.http_ip;
  var port = MCSERVER.localProperty.http_port;

  if (host == "::") host = "127.0.0.1";

  // Express HTTP 服务监听启动
  app.listen(MCSERVER.localProperty.http_port, MCSERVER.localProperty.http_ip, () => {
    MCSERVER.infoLog("HTTP", "HTTP 模块监听: [ http://" + (host || "127.0.0.1".yellow) + ":" + port + " ]");

    MCSERVER.infoLog("INFO", "配置文件: property.js 文件");
    MCSERVER.infoLog("INFO", "新版本已经可供使用，可以前往 Github 了解");
    MCSERVER.infoLog("INFO", "Github & 文档参阅: https://github.com/suwings/mcsmanager");

    if (MCSERVER.allError <= 0) {
      MCSERVER.infoLog("INFO", "控制面板已经启动");
      // 执行自启动任务
      require("./helper/AutoStartTask").startAutoTask();
    } else {
      MCSERVER.infoLog("INFO", "控制面板启动异常");
    }
  });
})();

// 用于捕捉前方所有路由都未经过的请求，则可为 404 页面
app.get("*", function (req, res) {
  // 重定向到 404 页面
  res.redirect("/public/template/404_page.html");
  res.end();
});

// 设置定时获取最新新闻动态
nodeSchedule.scheduleJob("59 59 23 * * *", function () {
  MCSERVER.infoLog("INFO", "自动更新新闻动态与最新消息");
  NewsCenter.requestNews();
});
// 重启自动获取一次
NewsCenter.requestNews();

// 程序退出信号处理
require("./core/procexit");
