var express = require('express');
var app = express();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Cookie and Session 的基础功能
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false,
}));
app.use(bodyParser.json());


var UUID = require('uuid');
app.use(session({
    secret: UUID.v4(),
    name: 'IFM_session',
    //1小时
    cookie: {
        maxAge: 1000 * 60 * 60
    },
    resave: true,
    saveUninitialized: true,
}));

app.use('/public', express.static('./public'));

app.post('/', function (req, res) {
    // app.use(express.static('public'));
});

var baseR = require('./controller/function');
var authR = require('./controller/auth');

// Not need
// process.on("uncaughtException", function (err) {
//     console.log('UncaughtException 机制错误报告:', err);
// });

app.use('/fs_auth', authR);
//必须先进行登陆
app.use(['/fs', '/public'], function (req, res, next) {
    if (req.session.fsos) {
        next();
        return true;
    }
    res.status(403).send('禁止访问：权限不足！');
});
app.use('/fs', baseR);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log(' - express Done');
    console.log(' - App Done');
    console.log(' - 访问即可使用与体验: http://localhost:%s/fs_auth/', port);
});