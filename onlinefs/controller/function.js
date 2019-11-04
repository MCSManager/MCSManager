const express = require('express');
const router = express.Router();
const pathm = require("path");
const {
    parseHandle,
    sendHandle,
    filesToPaths
} = require("../module/dataHandle");
const {
    FileOperateStructure,
    UseFileOperate
} = require("../model/fsoperate_session");
const fs = require("fs");
const os = require('os');



router.post('/mkdir', (req, res) => {
    let name = parseHandle(req.body, "string");
    if (name == "") return;
    let cwd = req.session.fsos.cwd;
    let fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    let sendObj = fileOperate.mkdir(pathm.join(cwd, name));
    sendHandle(req, res, sendObj);
});



router.post('/ls', (req, res) => {
    let name = parseHandle(req.body, "string") || "./";
    req.session.fsos.cwd = pathm.normalize(pathm.join(req.session.fsos.cwd, name));
    let fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    if (req.session.fsos.cwd == "..\\" || req.session.fsos.cwd == "../") req.session.fsos.cwd = "./"; //越级,重置
    let obj = fileOperate.lsType(req.session.fsos.cwd);
    req.session.save();
    sendHandle(req, res, obj);
});


router.post('/rm', (req, res) => {
    let stack = (parseHandle(req.body));
    let fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    let names = filesToPaths(stack, req.session.fsos.cwd);
    let obj = fileOperate.batchExectue(fileOperate.rm, names);
    sendHandle(req, res, true);
});


router.post('/cp', (req, res) => {
    let stack = (parseHandle(req.body));
    // let paths = filesToPaths(stack, req.session.fsos.cwd);
    req.session.fsoperate.tmp_files = stack;
    // req.session.fsoperate.tmp_paths = paths;
    req.session.fsoperate.tmp_cwd = req.session.fsos.cwd;
    req.session.fsoperate.tmp_action = "cp";
    req.session.save();
    sendHandle(req, res, null);
});


router.post('/ct', (req, res) => {
    let stack = (parseHandle(req.body));
    req.session.fsoperate.tmp_files = stack;
    req.session.fsoperate.tmp_cwd = req.session.fsos.cwd;
    req.session.fsoperate.tmp_action = "ct";
    req.session.save();
    sendHandle(req, res, null);
});


router.post('/patse', (req, res) => {
    let callFunc = null;
    let fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    if (req.session.fsoperate.tmp_action == "cp")
        callFunc = fileOperate.cp;
    else
        callFunc = fileOperate.mv;
    let oldpaths = filesToPaths(req.session.fsoperate.tmp_files, req.session.fsoperate.tmp_cwd);
    let newpaths = filesToPaths(req.session.fsoperate.tmp_files, req.session.fsos.cwd);
    let obj = fileOperate.batchExectue(callFunc, oldpaths, newpaths);

    sendHandle(req, res, obj);
});


router.post('/rename', (req, res) => {
    let json = (parseHandle(req.body));
    if (!json.newName || !json.oldName) return;
    if (json.newName.trim() == "" || json.oldName.trim() == "") return;
    let fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    let cwd = req.session.fsos.cwd;
    let oldPath = pathm.join(cwd, json.oldName);
    let newPath = pathm.join(cwd, json.newName);
    if (!fileOperate.isPathAccess(newPath)) {
        res.status(403).send("非法越级目录，权限阻止:" + oldPath + "->" + newPath);
        return;
    }
    sendHandle(req, res, fileOperate.mv(oldPath, newPath));
});


//文件内容读取路由
router.post('/edit_read', (req, res) => {
    const filename = (parseHandle(req.body))
    if (!filename) return;
    //没有经过安全的 UseFileOperate 进行安全操作
    //必须经过目录越级漏洞防御
    if (filename.indexOf('../') != -1 || filename.indexOf('./') != -1) return;
    const cwd = req.session.fsos.cwd;
    const fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    const filedata = fileOperate.readFile(pathm.join(cwd, filename));
    sendHandle(req, res, filedata.toString());
});

//文件内容写入路由
router.post('/edit_write', (req, res) => {
    const obj = (parseHandle(req.body))
    if (!obj || !obj.filename || !obj.context) return;
    //没有经过安全的 UseFileOperate 进行安全操作
    //必须经过目录越级漏洞防御
    if (obj.filename.indexOf('../') != -1 || obj.filename.indexOf('./') != -1) return;
    const cwd = req.session.fsos.cwd;
    const fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    const result = fileOperate.writeFile(pathm.join(cwd, obj.filename), obj.context);
    sendHandle(req, res, result);
});



//解压路由
router.post('/extract', (req, res) => {
    const zipName = (parseHandle(req.body))
    if (!zipName) {
        res.status(403).send("非法名称");
    }
    const fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    const cwd = req.session.fsos.cwd;
    fileOperate.extract(pathm.join(cwd, zipName));
    sendHandle(req, res, "OK");
});


//压缩文件路由
router.post('/compress', (req, res) => {
    const directoryName = (parseHandle(req.body))
    if (!directoryName) {
        res.status(403).send("非法名称");
    }
    const fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    const cwd = req.session.fsos.cwd;
    fileOperate.compress(pathm.join(cwd, directoryName));
    sendHandle(req, res, "OK");
});


const multiparty = require('multiparty');
router.post('/upload', (req, res) => {
    //权限判断,需要登录
    if (!req.session.fsos || !req.session.fsos.cwd) return;
    let fileOperate;
    var target_path;
    try {
        fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
        target_path = fileOperate.normalizePath(req.session.fsos.cwd); //获取绝对路径
        //生成multiparty对象，并配置上传目标路径
        var form = new multiparty.Form({
            uploadDir: os.tmpdir()
        });
    } catch (err) {
        res.status(500).send('服务器上传初始化错误!请重试!');
    }
    form.parse(req, function (err, fields, files) {
        if (err) {
            res.status(500).send('服务器内部错误,文件上传错误!');
            return;
        }
        try {
            var inputFile = files.upload_file[0];
            var uploadedPath = inputFile.path;
            var dstPath = pathm.join(target_path, inputFile.originalFilename);

            let readStream = fs.createReadStream(uploadedPath);
            let writeStream = fs.createWriteStream(dstPath);
            readStream.pipe(writeStream);
            fs.unlink(uploadedPath, (err) => { /*ignore*/ });
            res.send("Done");
        } catch (err) {
            res.status(500).send('上传虽然成功，但是处理文件出错: ' + err);
        }
    });
});

router.get('/download/:name', (req, res) => {
    if (!req.session.fsos || !req.session.fsos.cwd) return;
    if (!req.params.name) return;
    let fileOperate;
    try {
        fileOperate = new UseFileOperate(req.session.fsos).fileOperate;
    } catch (err) {
        res.status(500).send('文件下载错误,请重新登录并且重新下载.');
    }
    let cwd = req.session.fsos.cwd;
    let filename = pathm.join(cwd, req.params.name);
    res.sendfile(filename, {
        root: fileOperate.root(),
        dotfiles: 'deny',
        headers: {
            'Content-Disposition': "attachmnet",
            'filename': encodeURIComponent(req.params.name.trim())
        }
    }, (err) => { });

});





module.exports = router;