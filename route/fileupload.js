/*
 * @Author: Copyright(c) 2020 Suwings
 * @Date: 2020-10-08 13:28:28
 * @LastEditTime: 2020-12-05 23:34:08
 * @Description: 文件上传
 */
const express = require("express");
const router = express.Router();
const pathm = require("path");
const os = require("os");
const fs = require("fs");
const fsex = require("fs-extra");
const permission = require("../helper/Permission");

const multer = require("multer");
const upload = multer({ dest: "tmp_upload/" });

router.post("/", upload.single("upload_file"), (req, res) => {
  // 任意目录的文件上传，仅限于管理员使用
  if (!permission.needLogin(req, res)) return;
  if (!permission.IsSessionMaster(req, res)) {
    return res.status(500).send("权限不足");
  }
  // 文件上传域
  if (req.file && req.body["cwd"]) {
    const target_path = req.body["cwd"];
    if (!fs.existsSync(target_path)) fsex.mkdirSync(target_path);
    const originalname = req.file.originalname;
    const dstPath = pathm.join(target_path, originalname);
    fsex.rename(req.file.path, dstPath, (err) => {
      if (err) {
        res.status(500).send("上传虽然成功，但是处理文件出错: " + err);
      } else {
        MCSERVER.log("[ 文件上传 ] 用户", req.session["username"], "上传文件到", target_path);
        res.send("Done");
      }
      fsex.remove(req.file.path, () => {});
    });
  }
});

//模块导出
module.exports = router;
