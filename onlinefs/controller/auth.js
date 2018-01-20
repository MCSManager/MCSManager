const express = require('express');
const router = express.Router();
const {
    FileOperateStructure,
} = require("../model/fsoperate_session");
const userModel = require('../../model/UserModel');
const permission = require('../../helper/Permission');
const serverModel = require('../../model/ServerModel');
const pathm = require("path");

//自定义扩展
router.all('/auth/:servername', (req, res) => {
    let serverName = req.params.servername;
    let userName = req.session['username'];
    if (!serverName || !userName) {
        res.send("[ 权限阻止 ] ");
        return;
    }

    let dataModel = null;
    if (serverModel.ServerManager().isExist(serverName) && permission.isCanServer(userName, serverName)) {
        dataModel = serverModel.ServerManager().getServer(serverName).dataModel || null;
    }
    if (!dataModel || !dataModel.cwd) {
        res.send("[ 权限阻止 ] dataModel 空，无权限操作的服务器！");
        return;
    };
    let cwd = null;
    if (!pathm.isAbsolute(dataModel.cwd))
        cwd = pathm.normalize(pathm.join(pathm.join(__dirname, "../../"), dataModel.cwd));
    else
        cwd = dataModel.cwd;
    MCSERVER.log("[Online Fs]", "用户", userName, "访问服务器", serverName, "根:", cwd);

    req.session.fsos = new FileOperateStructure(cwd, "./");
    req.session.fsoperate = {};
    req.session.fsoperate.tmp = [];
    req.session.save();
    res.redirect('/public/onlinefs_public');
});


router.all('/logout', (req, res) => {
    req.session.fsos = null;
    req.session.fsoperate = null;
    res.send('[正常] 您已安全退出，现在可以关闭这个网页。');
});


module.exports = router;