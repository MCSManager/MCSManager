//基础的路由定义
const router = require('express')();
const response = require('../helper/Response');
const permssion = require('../helper/Permission');
const VarCenter = require('../model/VarCenter');
const counter = require('../core/counter');
//Token 

router.get('/', function (req, res) {
    //ajax 会受到浏览器跨域限制，姑不能对其进行csrf攻击获取token，尽管它可伪造。
    if (req.xhr) {
        if (!req.session['token']) {
            req.session['token'] = permssion.randomString(32);
        }
        VarCenter.get('user_token')[req.session['token']] = req.session['username'];
        response.returnMsg(res, 'token', {
            token: req.session['token'],
            username: req.session['username'],
        });
    } else {
        counter.plus('csrfCounter');
        res.send('<h1>CSRF 防御策略</h1><hr><p>您不能直接访问本页面,这是为了防御 CSRF 攻击,务必直接访问首页!</p>' +
            '<p>具体信息我们将统计到非法 API 请求,这可能需要值得您注意.</p>');
    }
});


//模块导出
module.exports = router;

    // res.header('X-Powered-By','Mcserver Manager HTT_P_SERVER');
    //res.cookie('token_to',permssion.randomString(32));







