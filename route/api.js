const router = require('express')();
const serverModel = require('../model/ServerModel');

//公开 服务端状态获取 JSON格式
router.all('/get/:name', function (req, res) {
    let params = req.params || {};
    let serverName = params.name || "";
    let mcserver = serverModel.ServerManager().getServer(serverName.trim());
    if (mcserver == null) {
        res.send("null");
        return;
    }
    let sendStatus = {
        serverName: serverName,
        lastDate: mcserver.dataModel.lastDate,
        status: mcserver.isRun()
    };
    res.send(JSON.stringify(sendStatus));
    res.end();
});

//公开 服务端状态获取 可视模式
router.all('/status/:name', function (req, res) {
    let params = req.params || {};
    let serverName = params.name || "";
    //十分简单的网页模板
    let template = '<!DOCTYPE html><html><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>$0</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>$1</body></html>';
    let mcserver = serverModel.ServerManager().getServer(serverName.trim());
    if (mcserver == null) {
        res.send("Not Found");
        return;
    }
    //渲染模板
    template = template.replace(/\$0/igm, "状态信息");
    template = template.replace(/\$1/igm, [
        "服务端名:" + serverName,
        "启动时间:" + mcserver.dataModel.lastDate,
        "状态:" + (mcserver.isRun() ? "正在运行" : "关闭")
    ].join("<br />"));

    res.send(template);
    res.end();
});


//模块导出
module.exports = router;