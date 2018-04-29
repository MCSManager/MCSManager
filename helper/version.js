const os = require("os");

//前端显示版本
//每次更新之后,修改此处,表明修改
//这样, 用户截图时, 可以知道具体的版本
const oversion = "Beta_8.3.0.0"; //前端
const tversion = "Beta_8.3.0.0"; //后端

//首页
// WebSocketObserver().listener('index/update', (data) => {
//     if (!permssion.isMaster(data.WsSession)) return;
//     response.wsSend(data.ws, 'index/update', {
//         system: os.type() + " " + os.arch(),
//         root: process.cwd(),
//         oneversion: oversion,
//         twoversion: tversion
//     })
// });

let info = [os.type(), os.arch(), os.hostname(), os.release()].join(" ");

module.exports = {
    system: info,
    root: process.cwd(),
    oneversion: oversion,
    twoversion: tversion
}