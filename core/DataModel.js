let fs = require('fs');
const EventEmitter = require('events');


class DataModel {

    constructor(filename) {
        this.__filename__ = './' + filename + '.json';
    }

    filename(newFilename) {
        if (newFilename) this.__filename__ = newFilename + '.json';
        else return this.__filename__;
    }

    load() {
        // 同步而非异步 因为我们必须要线性执行而且读取的文件很小
        let data = fs.readFileSync(this.__filename__, 'utf-8');
        let ele = JSON.parse(data);
        for (var key in ele) {
            this[key] = ele[key];
        }
    }

    save() {
        let name = this.__filename__;
        // 同步而非异步 因为我们必须要线性执行而且读取的文件很小
        fs.writeFileSync(this.__filename__, JSON.stringify(this, null, 4));
    }

    isExist(callback) {
        fs.exists(this.filename, function(exists) {
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