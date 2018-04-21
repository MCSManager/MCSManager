//基础的路由定义
const router = require('express')();
const response = require('../helper/Response');
const permssion = require('../helper/Permission');
const TokenManager = require('../helper/TokenManager');
const counter = require('../core/counter');
const UUID = require('uuid');
const loginedContainer = require('../helper/LoginedContainer');

function getRandToken() {
    return permssion.randomString(6) + UUID.v4().replace(/-/igm, "");
}

//Token 
router.get('/', function (req, res) {
    let username = req.session['username'] || undefined;
    //ajax 会受到浏览器跨域限制，姑不能对其进行csrf攻击获取token，尽管它可伪造。
    if (req.xhr) {

        if (!username || !loginedContainer.isLogined(req.sessionID)) {
            MCSERVER.log('[ Token ]', '未登录用户 ', username, ' 请求更新令牌 | 已经阻止');
            //用户未登录，返回一个随机的 token 给它，并且这个 token 与正常的 token 几乎一模一样
            response.returnMsg(res, 'token', {
                token: getRandToken(),
                username: username,
            });
            return;
        }

        //删除原先可能存在的
        TokenManager.delToken(req.session['token'] || null);

        //永远生产一个新的
        let newtoken = getRandToken();
        TokenManager.addToken(newtoken, username);
        req.session['token'] = newtoken;
        req.session.save();

        MCSERVER.log('[ Token ]', '用户 ', username, ' 请求更新令牌 | 准许');

        response.returnMsg(res, 'token', {
            token: req.session['token'],
            username: username,
        });
    } else {
        counter.plus('csrfCounter');
        res.send('<h1>CSRF 防御策略</h1><hr><p>您不能直接访问本页面,这是为了防御 CSRF 攻击,务必直接访问首页!</p>' +
            '<p>具体信息我们将统计到非法 API 请求,这可能需要值得您注意.</p>');
    }
    res.end();
});


//模块导出
module.exports = router;

// res.header('X-Powered-By','Mcserver Manager HTT_P_SERVER');
//res.cookie('token_to',permssion.randomString(32));