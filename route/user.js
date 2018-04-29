//基础的路由定义
const router = require('express')();
var session = require('express-session');

const {
    loginUser,
    userCenter
} = require('../model/UserModel');
const response = require('../helper/Response');
const permssion = require('../helper/Permission');
const loginedContainer = require('../helper/LoginedContainer');
const tools = require('../core/tools');
const TokenManager = require('../helper/TokenManager');
const userManager = userCenter();

//用户退出事件
router.post('/loginout', function (req, res) {
    if (!req.xhr) return;
    MCSERVER.log('[loginout] 用户:' + req.session['username'] + '退出');
    //删除一些辅助管理器的值
    if (req.session['username'] && req.session['login'])
        loginedContainer.delLogined(req.sessionID);

    TokenManager.delToken(req.session['token']);

    //退出后的 Session 并不会立刻反馈到所有 Session 上
    req.session['login'] = false;
    req.session['username'] = undefined;
    req.session['token'] = undefined;
    req.session.destroy();
    response.returnMsg(res, 'user/logout', 'loginOut');
});

MCSERVER.login._banip = 0;

function LoginRule(ip) {
    let count = MCSERVER.login[ip] || 0;
    if (count > 10) {
        //值触发一次定时器
        if (count == 11) {
            setTimeout(() => {
                MCSERVER.login[ip] = 0;
            }, 1000 * 60 * 10);
        }
        return false;
    }
    return true;
}

//唯一性登录检查
function OnlyLoginCheck(sessionID) {
    for (let k in MCSERVER.allSockets) {
        if (MCSERVER.allSockets[k].sessionID == sessionID) {
            return true;
        }
    }
    return false;
}

const counter = require('../core/counter');

//用户登录请求路由
router.post('/login', function (req, res) {
    if (!req.xhr) return;
    let ip = req.socket.remoteAddress;
    let username = req.body.username || '';
    let password = req.body.password || '';
    let enkey = req.session['login_md5key'] || '';
    //登陆规则
    if (!LoginRule(ip)) {
        response.returnMsg(res, 'login/check', "密码错误次数过多!您已被锁定!请10分钟之后再进行登录!");
        return;
    };

    //判断是否有 ws 正在连接 
    if (OnlyLoginCheck(req.sessionID)) {
        response.returnMsg(res, 'login/check', "您已在此浏览器登录过账号,请关闭所有与服务器的链接网页并退出账号!");
        return;
    }

    //同 Session 只可登录一个 用户
    if (loginedContainer.isLogined(req.sessionID)) {
        response.returnMsg(res, 'login/check', 302);
        return;
    }

    //登陆次数加一
    counter.plus('login');

    MCSERVER.log(['[Login]'.green, '用户尝试登陆:', username, "密匙:", password].join(" "));

    loginUser(username, password, (loginUser) => {
        //只有这里 唯一的地方设置 login = true
        req.session['login'] = true;
        req.session['username'] = loginUser.dataModel.username;
        req.session['dataModel'] = loginUser.dataModel; //Only read
        req.session['login_md5key'] = undefined;
        req.session.save();
        delete MCSERVER.login[ip];
        //添加到 login 容器  注意，全部代码只能有这一个地方使用这个函数
        loginedContainer.addLogined(req.sessionID, username, loginUser.dataModel);
        response.returnMsg(res, 'login/check', true);
    }, () => {
        //密码错误记录
        MCSERVER.login[ip] ? MCSERVER.login[ip]++ : MCSERVER.login[ip] = 1;
        //防止数目过于太大 溢出
        MCSERVER.login[ip] > 1000 ? MCSERVER.login[ip] = 1000 : MCSERVER.login[ip] = MCSERVER.login[ip];
        //passwordError
        counter.plus('passwordError');
        req.session['login'] = false;
        req.session['username'] = undefined;
        req.session['login_md5key'] = undefined;
        req.session['dataModel'] = undefined;
        req.session.save();
        //删除到 login 容器
        if (req.session['username']) loginedContainer.delLogined(req.sessionID);
        response.returnMsg(res, 'login/check', false);
    }, enkey);
});

//用户请求登录键路由
router.get('/login_key', function (req, res) {
    if (!req.xhr) return;
    let username = req.query.username || null;
    let md5Key = req.session['login_md5key'] || tools.randomString(32);
    let okflag = true;

    //拒绝掉已登录用户
    if (!username || loginedContainer.isLogined(req.sessionID))
        okflag = false;


    req.session['login_md5key'] = md5Key;
    //取salt
    let loggingUser = userManager.get(username);
    //是否存在用户名 && Flag is true
    if (loggingUser && okflag) {
        res.send(JSON.stringify({
            //salt
            enkey1: loggingUser.dataModel.salt,
            //md5Key
            enkey2: md5Key
        }));
        return;
    }

    //这里是 随机的 salt 与 md5key 因为用户根本不存在，则返回一个随机的类似于正常的信息，让前端判断错误
    //防止轻而易举的遍历用户名，但这仍然可以通过两次或三次尝试判断用户名是否存在
    res.send(JSON.stringify({
        enkey1: tools.randomString(6),
        enkey2: tools.randomString(32)
    }));
});



//模块导出
module.exports = router;