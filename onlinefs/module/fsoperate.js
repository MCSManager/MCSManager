const fs = require("fs");
const path_moduel = require("path");
const { BaseFileOperate } = require("./base_fsoperate");
const fsex = require("fs-extra");
const child_process = require("child_process");

// 最大同时解压任务
let MAX_EXTRACT_AND_COMPRESS_TASK_LIMIT = MCSERVER.localProperty.max_eac_task_limit || 1;
// 当前解压任务
let nowEacTaskCounter = 0;
// 解压缩任务队列
const EAC_QUQUE = [];

// 解压缩队列循环器
setInterval(() => {
  if (nowEacTaskCounter < MAX_EXTRACT_AND_COMPRESS_TASK_LIMIT) {
    // category: 'compress',
    // path: absPath
    const task = EAC_QUQUE.pop();
    if (task == null) return;
    nowEacTaskCounter += 1;
    const extend_worker = child_process.fork("./onlinefs/module/extend_worker.js", [task["category"], task["path"]]);
    extend_worker.on("close", () => {
      nowEacTaskCounter -= 1;
    });
  }
}, 1000);

//文件操作具体
class FileOperate extends BaseFileOperate {
  constructor(args) {
    super(args);
  }

  type(path) {
    return this.pathAccessCheck(path, (absPath) => {
      let info = fs.statSync(absPath);
      // let other = "";
      // other = info.isFIFO() ? "FIFO" :
      //     info.isSocket() ? "Socket" :
      //     info.isCharacterDevice() ? "CharacterDevice" :
      //     info.isBlockDevice() ? "BlockDevice" :
      //     info.isSymbolicLink() ? "SymbolicLink" : "";
      return {
        name: path_moduel.basename(absPath),
        size: info.size,
        isFile: !info.isDirectory(),
        time: info.mtime,
        // info: other,
        checkbox: false, //唯一前端数据
      };
    });
  }

  ls(path) {
    return this.pathAccessCheck(path, (absPath) => fs.readdirSync(absPath));
  }

  lsType(path) {
    let result = [];
    let that = this;
    this.pathAccessCheck(path, (absPath) => {
      let list = fs.readdirSync(absPath);
      for (const v of list) {
        let pathonce = path_moduel.join(absPath, v);
        result.push(that.type(pathonce));
      }
    });
    return result;
  }

  mkdir(path) {
    return this.pathAccessCheck(path, (absPath) => {
      fs.mkdirSync(absPath);
      return fs.existsSync(absPath);
    });
  }

  _forEachFile(path, callbackExec = null) {
    var files = [];
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path);
      for (let file of files) {
        var curPath = path + "/" + file;
        if (fs.statSync(curPath).isDirectory()) {
          // recurse
          this._rm_rf(curPath);
        } else {
          // delete file
          callbackExec && callbackExec(curPath);
        }
      }
    }
    fs.rmdirSync(path);
  }

  _rm_rf(path) {
    //递归
    this._forEachFile(path, (p) => {
      fs.unlinkSync(p);
    });
  }

  rm(path) {
    this.pathAccessCheck(path, (absPath) => {
      //如果仅单文件则直接删除
      if (!fs.statSync(absPath).isDirectory()) {
        fsex.remove(absPath, (err) => {
          if (err) return;
        });
      } else {
        //若删除文件夹则分配子进程来进行解压操作
        child_process.fork("./onlinefs/module/extend_worker.js", ["remove", absPath]);
      }
    });
  }

  mv(srcpath, newpath) {
    return this.pathAccessCheck([srcpath, newpath], (paths) => {
      fs.renameSync(paths[0], paths[1]);
      return fs.existsSync(paths[1]) && !fs.existsSync(paths[0]);
    });
  }

  cp(srcpath, newpath) {
    return this.pathAccessCheck([srcpath, newpath], (paths) => {
      if (!fs.existsSync(paths[0])) return false;
      fsex.copy(paths[0], paths[1], function (err) {
        if (err) return;
      });
      return true;
    });
  }

  //获取某目录下详细数据
  readFiles(path) {
    return this.pathAccessCheck(path, (absPath) => {
      if (!fs.statSync(absPath).isDirectory()) return null;
      let files = fs.readdirSync(absPath);
      let result = [];
      for (let v of files) {
        let info = fs.statSync(path_moduel.join(absPath, v));
        result.push(info);
      }
      if (result.length <= 0) return null;
      return result;
    });
  }

  // this.batchExectue(a, [a, b, c], [a, b, c]);
  batchExectue(exectue, ...argsList) {
    let argsListLen = argsList.length;
    let argsZeroLen = argsList[0].length; //第一个参数为参考
    let resultStack = [];
    for (let i = 0; i < argsZeroLen; i++) {
      let argsStack = [];
      for (let z = 0; z < argsListLen; z++) {
        argsStack.push(argsList[z][i]);
      }
      let result = exectue.apply(this, argsStack);
      resultStack.push(result);
    }
    return resultStack;
  }

  // 解压文件
  extract(path) {
    return this.pathAccessCheck(path, (absPath) => {
      // 加入到解压缩队列
      EAC_QUQUE.push({
        category: "extract",
        path: absPath,
      });
    });
  }

  // 压缩文件
  compress(path) {
    return this.pathAccessCheck(path, (absPath) => {
      // 加入到解压缩队列
      EAC_QUQUE.push({
        category: "compress",
        path: absPath,
      });
    });
  }

  static getEACQuque() {
    return EAC_QUQUE;
  }

  static getNowEacTaskCounter() {
    return nowEacTaskCounter;
  }

  writeFile(path, data) {
    return this.pathAccessCheck(path, (absPath) => {
      try {
        fs.writeFileSync(absPath, data);
        return fs.existsSync(absPath);
      } catch (err) {
        MCSERVER.error("文件写出错:\n", err);
        return false;
      }
    });
  }

  readFile(path) {
    return this.pathAccessCheck(path, (absPath) => {
      try {
        if (fs.existsSync(absPath)) {
          return fs.readFileSync(absPath);
        }
      } catch (err) {
        MCSERVER.error("文件读出错:\n", err);
        return false;
      }
    });
  }
}

exports.FileOperate = FileOperate;
