//基础的路由定义
const router = require('express')();

//路由定义
router.get('/404', function (req, res) {
    res.send('404 地址错误');
});

router.get('/500', function (req, res) {
    res.send('500 服务器错误');
});

router.get('/403', function (req, res) {
    res.send('403 权限不足');
});

router.get('/599', function (req, res) {
    res.send('599 不可思议的操作');
});

router.get('/499', function (req, res) {
    res.send('499 安全机制触发');
});

router.get('/notlogin', function (req, res) {
    res.send('您没有登录');
});

router.get('/token', function (req, res) {
    res.send('token ERROR');
});


//模块导出
module.exports = router;