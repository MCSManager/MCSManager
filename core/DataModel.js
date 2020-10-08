let fs = require("fs");

// 数据模型类
// 用作数据与真实文件之间的抽象关系，数据模型保存的所有数据均会序列化成 JSON 格式保存在文件中。
class DataModel {
  constructor(filename) {
    this.__filename__ = "./" + filename + ".json";
  }

  filename(newFilename) {
    if (newFilename) this.__filename__ = newFilename + ".json";
    else return this.__filename__;
  }

  // 从JSON文件装载到数据模型
  load() {
    let data = fs.readFileSync(this.__filename__, "utf-8");
    let ele = JSON.parse(data);
    for (var key in ele) {
      this[key] = ele[key];
    }
  }

  // 数据模型写入到JSON文件中
  save() {
    fs.writeFileSync(this.__filename__, JSON.stringify(this, null, 4));
  }

  isExist(callback) {
    fs.exists(this.filename, function (exists) {
      callback(exists);
    });
  }

  update(needJson) {
    for (let key in needJson) {
      this[key] = needJson[key];
    }
  }

  upload(that, needkey) {
    let key = null;
    if (needkey == undefined) {
      // eslint-disable-next-line no-unused-vars
      for (var mineKey in this) {
        that[key] = this[key];
      }
      return;
    }
    for (let i = 0; i < needkey.length; i++) {
      key = needkey[i];
      if (this.hasOwnProperty(key)) {
        that[key] = this[key];
      } else {
        that[key] = undefined;
      }
    }
    return;
  }
}

module.exports = DataModel;
