/*
 * @Author: Copyright(c) 2020 Suwings
 * @Date: 2020-10-08 13:28:28
 * @LastEditTime: 2021-06-23 10:50:16
 * @Description: 版本发行说明文件
 */
const os = require("os");

//前端显示版本
//每次更新之后,修改此处,表明修改
//这样, 用户截图时, 可以知道具体的版本
//请用户尽可能的不要修改本文件任何代码，因为每一次版本更新时，必定会冲突

const verisonA = "8.7.0 发行版本"; //发行版本

const verisonB = "No.20211110-02"; //版本批次

let info = [os.type(), os.arch(), os.hostname(), os.release()].join(" ");

module.exports = {
  system: info,
  root: process.cwd(),
  verisonA: verisonA,
  verisonB: verisonB,
};
