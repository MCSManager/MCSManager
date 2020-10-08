// 日志命令操作类

const fs = require("fs");
const HISTORY_SIZE_LINE = 1024;
const FILE_CODE = "utf8";

// 默认目录 RecordTmp
class RecordCommand {
  constructor(path = "") {
    this.path = path;
    this.timerlock = false;
  }

  // 获取当前这一刻的 log 文本文件大小
  // 可以定位当前日志起始位置
  recordLength() {
    try {
      let fsstat = fs.statSync(this.path);
      return fsstat.size;
    } catch (err) {
      return 0;
    }
  }

  // 向最后追加一行或一堆数据
  writeRecord(data = "") {
    if (fs.existsSync(this.path))
      fs.appendFile(this.path, data, FILE_CODE, function (err) {
        if (err) throw err;
      });
    else fs.writeFileSync(this.path, new Buffer(HISTORY_SIZE_LINE * 2).toString() + data);
  }

  readRecord(pstart = 0, length = 32, callback = () => {}) {
    if (!fs.existsSync(this.path)) return;

    const fsstat = fs.statSync(this.path);
    const filesize = fsstat.size;

    let buffer = new Buffer(length);

    // Start Read from file
    fs.open(this.path, "r", function (err, fd) {
      if (err) return;

      if (pstart >= filesize || pstart <= 0) return;

      // 读取文件
      fs.read(fd, buffer, 0, length, pstart, function (err, bytesRead, buffer) {
        if (err) return;

        // 打印出buffer中存入的数据
        let resStr = buffer.slice(0, bytesRead).toString();
        callback(resStr);

        // 关闭文件
        fs.close(fd, () => {});
      });
    });
  }
}

module.exports.RecordCommand = RecordCommand;
