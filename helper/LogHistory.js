"use strict";
// 日志历史储存

const fs = require("fs");
const fsExtra = require("fs-extra");

const MAX_HISTORY_SIZE = 1024 * 1024 * 3;
const BASE_RECORD_DIR = "./server/tmp_log_history/";
const FILE_CODE = "utf8";

class LogHistory {
  constructor(id) {
    this.id = id;
    this.readPoints = {};
    this.log = new Array();
    this.path = BASE_RECORD_DIR + id + ".log";
    if (!fsExtra.existsSync(BASE_RECORD_DIR)) {
      fsExtra.mkdirs(BASE_RECORD_DIR);
    }
  }

  writeLine(text = "") {
    if (text.length == 0) return;

    if (fs.existsSync(this.path)) {
      try {
        const fd = fs.openSync(this.path, "a+");
        fs.writeSync(fd, text, FILE_CODE);
        fs.closeSync(fd);
        let fsstat = fs.statSync(this.path);
        let size = fsstat.size;
        if (size > MAX_HISTORY_SIZE) {
          this.delete();
        }
      } catch (err) {
        // 忽略
      }
    } else {
      fs.writeFile(this.path, text, (err) => {
        if (err) MCSERVER.log("实例", this.id, "日志历史记录文件创建错误:", err.message);
      });
    }
  }

  readLine(demander = "", size = 1024, callback = () => {}) {
    if (!this.readPoints[demander]) {
      this.readPoints[demander] = 0;
    }
    if (!fs.existsSync(this.path)) {
      callback && callback("");
      return this;
    }
    const demanderPoint = this.readPoints[demander];
    const buffer = Buffer.alloc(size);
    fs.open(this.path, "r", (err, fd) => {
      if (err) {
        MCSERVER.log("实例", this.id, "日志历史记录文件打开错误:", err.message);
        fs.closeSync(fd);
        return;
      }
      // 计算末尾读取的指针位置
      let fileSize = fs.statSync(this.path).size;
      let endReadPoint = fileSize - demanderPoint - size - 1;
      if (endReadPoint <= 0 || endReadPoint >= fileSize) {
        callback && callback("");
        return;
      }
      // 倒置指针，从末尾开始读字符
      fs.read(fd, buffer, 0, size, endReadPoint, (err, bytesRead, buffer) => {
        if (err) {
          MCSERVER.log("实例", this.id, "日志历史记录文件读取错误:", err.message);
          fs.closeSync(fd);
          return;
        }
        const logText = buffer.slice(0, bytesRead).toString();
        this.readPoints[demander] += size;
        callback && callback(logText);
        // 关闭文件
        fs.closeSync(fd);
      });
    });
    return this;
  }

  readLineOnce(demander = "", size = 1024, callback = () => {}) {
    if (!this.readPoints[demander]) {
      this.readPoints[demander] = 0;
    }
    if (!fs.existsSync(this.path)) {
      callback && callback("");
      return this;
    }
    const demanderPoint = this.readPoints[demander];
    const buffer = Buffer.alloc(size);
    fs.open(this.path, "r", (err, fd) => {
      if (err) {
        MCSERVER.log("实例", this.id, "日志历史记录文件打开错误:", err.message);
        return;
      }
      // 计算末尾读取的指针位置
      let fileSize = fs.statSync(this.path).size;
      let endReadPoint = fileSize - demanderPoint - size - 1;
      if (endReadPoint <= 0 || endReadPoint >= fileSize) {
        callback && callback("");
        return;
      }
      // 倒置指针，从末尾开始读字符
      fs.read(fd, buffer, 0, size, endReadPoint, (err, bytesRead, buffer) => {
        if (err) {
          MCSERVER.log("实例", this.id, "日志历史记录文件读取错误:", err.message);
          return;
        }
        const logText = buffer.slice(0, bytesRead).toString();
        // 不增加指针位置
        // this.readPoints[demander] += size;
        callback && callback(logText);
        // 关闭文件
        fs.close(fd, () => {});
      });
    });
    return this;
  }

  setPoint(demander, v) {
    this.readPoints[demander] = v;
  }

  delete() {
    if (fs.existsSync(this.path)) {
      const fd = fs.openSync(this.path, "w");
      fs.writeSync(fd, "", FILE_CODE);
      fs.closeSync(fd);
    }
    return this;
  }
}

module.exports = {
  LogHistory,
};
