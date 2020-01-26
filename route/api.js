const router = require('express')();
const serverModel = require('../model/ServerModel');
const fs = require('fs');
const mcPingProtocol = require('../helper/MCPingProtocol');

//公开 服务端状态获取 JSON格式
router.all('/status/:name', function (req, res) {
    if (MCSERVER.localProperty.allow_status_api) {
        res.send("管理员禁止此项功能 | Access denied");
        return;
    }
    let params = req.params || {};
    let serverName = params.name || "";
    let mcserver = serverModel.ServerManager().getServer(serverName.trim());
    if (mcserver == null) {
        res.send("null");
        return;
    }
    let sendStatus = null;

    // 取缓存资料
    const mcpingResult = mcPingProtocol.QueryMCPingTask(serverName)

    // 判断服务器启动状态发送不同的数据
    if (mcserver.isRun() && mcpingResult) {
        sendStatus = {
            id: serverName,
            serverName: mcserver.dataModel.mcpingConfig.mcpingName,
            lastDate: mcserver.dataModel.mcpingConfig.lastDate,
            status: mcserver.isRun(),
            current_players: mcpingResult.current_players,
            max_players: mcpingResult.max_players,
            motd: mcserver.dataModel.mcpingConfig.mcpingMotd || mcpingResult.motd,
            version: mcpingResult.version
        };
    } else {
        sendStatus = {
            id: serverName,
            lastDate: mcserver.dataModel.lastDate,
            status: mcserver.isRun(),
        };
    }

    res.send(JSON.stringify(sendStatus));
    res.end();
});


//公开 服务端状态获取 可视模式
// router.all('/status/:name', function (req, res) {
//     if (MCSERVER.localProperty.allow_status_api) {
//         res.send("管理员禁止此项功能 | Access denied");
//         return;
//     }
//     let params = req.params || {};
//     let serverName = params.name || "";
//     //十分简单的网页模板
//     try {
//         let template = fs.readFileSync("./public/template/api_server.html").toString();
//         let mcserver = serverModel.ServerManager().getServer(serverName.trim());
//         if (mcserver == null) {
//             res.send("Not Found");
//             return;
//         }
//         //渲染模板
//         template = template.replace(/\$servername/igm, serverName);
//         template = template.replace(/\$last_time/igm, mcserver.dataModel.lastDate);
//         template = template.replace(/\$status/igm, mcserver.isRun() ? "正在运行" : "关闭");

//         res.send(template);
//     } catch (err) {
//         MCSERVER.error('API 处理异常:', err);
//     }
//     res.end();
// });


//模块导出
module.exports = router;