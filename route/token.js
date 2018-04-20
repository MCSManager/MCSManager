//基础的路由定义
const router = require('express')();
const response = require('../helper/Response');
const permssion = require('../helper/Permission');
const VarCenter = require('../model/VarCenter');
const counter = require('../core/counter');
const UUID = require('uuid');
//Token 

router.get('/', function (req, res) {
    let username = req.session['username'] || undefined;
    //ajax 会受到浏览器跨域限制，姑不能对其进行csrf攻击获取token，尽管它可伪造。
    if (req.xhr) {
        if (!req.session['token']) {
            MCSERVER.log('[ Token ]', '用户 ', username, ' 请求更新令牌');
            //强化 token
            req.session['token'] = permssion.randomString(6) + UUID.v4().replace(/-/igm, "");
        }
        if (username == undefined || username.trim() == '' || !req.session['login']) {
            //用户未登录，返回一个随机的 token 给它，并且这个 token 与正常的 token 几乎一模一样
            response.returnMsg(res, 'token', {
                token: permssion.randomString(6) + UUID.v4().replace(/-/igm, ""),
                username: username,
            });
            return;
        }
        let maybeUsername = VarCenter.get('user_token')[req.session['token']];
        if (maybeUsername) {
            console.log("已经存在！！！！！！！！！！！！！！");

        }

        VarCenter.get('user_token')[req.session['token']] = username;
        req.session.save();
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