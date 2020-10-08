const express = require("express");
const router = express.Router();
const pathm = require("path");
const os = require("os");
const fs = require("fs");
const fsex = require("fs-extra");
const permission = require("../helper/Permission");

const multiparty = require("multiparty");
router.post("/", (req, res) => {
  // 任意目录的文件上传，仅限于管理员使用
  if (!permission.needLogin(req, res)) return;
  if (!permission.IsSessionMaster(req, res)) {
    res.status(500).send("权限不足");
    return;
  }

  // Note：此处有可上传任意文件到任意目录的危险
  // 但此仅限于管理员使用

  const form = new multiparty.Form({
    uploadDir: os.tmpdir()
  });
  form.parse(req, function (err, fields, files) {
    if (err) {
      res.status(500).send("服务器内部错误,文件上传错误!");
      return;
    }
    try {
      const target_path = fields["cwd"][0];
      // 不存在目标则创建
      if (!fs.existsSync(target_path)) fsex.mkdirSync(target_path);

      // 准备移动已上传的文件
      const inputFile = files.upload_file[0];
      const uploadedPath = inputFile.path;
      const dstPath = pathm.join(target_path, inputFile.originalFilename);
      // 文件已经上传，开始移动
      const readStream = fs.createReadStream(uploadedPath);
      const writeStream = fs.createWriteStream(dstPath);
      readStream.pipe(writeStream);
      // 删除遗留旧文件
      fs.unlink(uploadedPath, () => {
        /*ignore*/
      });
      res.send("Done");

      MCSERVER.log("[ 文件上传 ] 用户", req.session["username"], "上传文件到", target_path);
    } catch (err) {
      res.status(500).send("上传出错" + err);
    }
  });
});

//模块导出
module.exports = router;
