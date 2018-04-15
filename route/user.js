//基础的路由定义
const router = require('express')();
var session = require('express-session');

const {
    loginUser,
    userCenter
} = require('../model/UserModel');
const response = require('../helper/Response');
const permssion = require('../helper/Permission');
const tools = require('../core/tools');

const userManager = userCenter();

router.post('/loginout', function (req, res) {

    MCSERVER.log('[loginout] 用户:' + req.session['username'] + '退出');
    // BUG Note: Ws—close 与 Loginout 时 Session 可能不一定及时同步
    // 导致我们暂时无法用一种很简单的方式来实现动态的更换 token
    req.session['login'] = false;
    req.session['username'] = undefined;
    // req.session['login_md5key'] = null;
    // req.session['token'] = null;
    // req.session['dataModel'] = {};
    // req.session.save();
    req.session.destroy();
    response.returnMsg(res, 'user/logout', 'loginOut');
    res.end();
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

const counter = require('../core/counter');

router.post('/login', function (req, res) {
    let ip = req.socket.remoteAddress;
    let username = req.body.username || '';
    let password = req.body.password || '';
    let enkey = req.session['login_md5key'] || '';
    //登陆规则
    if (!LoginRule(ip)) {
        return;
    };
    //登陆次数加一
    counter.plus('login');
    loginUser(username, password, (loginUser) => {
        //只有这里 唯一的地方设置 login = true
        req.session['login'] = true;
        req.session['username'] = username;
        req.session['dataModel'] = loginUser.dataModel; //Only read
        req.session['login_md5key'] = undefined;
        req.session.save();
        delete MCSERVER.login[ip];
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
        response.returnMsg(res, 'login/check', false);
    }, enkey);
});

router.get('/login_key', function (req, res) {
    let username = req.query.username || '';
    let md5Key = req.session['login_md5key'] || tools.randomString(32);

    req.session['login_md5key'] = md5Key;
    //取salt
    let loggingUser = userManager.get(username);
    //是否存在用户名
    if (loggingUser) {
        //伪装的 enkey
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