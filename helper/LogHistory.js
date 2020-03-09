"use strict";
// 日志历史储存

const fs = require('fs');
const fsExtra = require('fs-extra');

const MAX_HISTORY_SIZE = 1024 * 1024 * 1;
const BASE_RECORD_DIR = './server/tmp_log_history/';
const FILE_CODE = "utf8";

class LogHistory {
    constructor(id) {
        this.id = id;
        this.readPoints = {};
        this.log = new Array();
        this.path = BASE_RECORD_DIR + id + '.log';
        if (!fsExtra.existsSync(BASE_RECORD_DIR)) {
            fsExtra.mkdirs(BASE_RECORD_DIR);
        }
    }

    writeLine(text = "") {
        if (text.length == 0) return;
        if (fs.existsSync(this.path))
            fs.appendFile(this.path, text, FILE_CODE, (err) => {
                if (err) MCSERVER.log('实例', this.id, '日志历史记录文件写入错误:', err.message);
                let fsstat = fs.statSync(this.path);
                let size = fsstat.size;
                if (size > MAX_HISTORY_SIZE) {
                    fs.unlinkSync(this.path);
                }
            });
        else
            fs.writeFile(this.path, text, (err) => {
                if (err) MCSERVER.log('实例', this.id, '日志历史记录文件创建错误:', err.message);
            });
    }

    readLine(demander = "", size = 1024, callback = () => { }) {
        if (!this.readPoints[demander]) {
            this.readPoints[demander] = 0;
        }
        const demanderPoint = this.readPoints[demander];
        const buffer = Buffer.alloc(size);
        fs.open(this.path, 'r', (err, fd) => {
            if (err) {
                MCSERVER.log('实例', this.id, '日志历史记录文件打开错误:', err.message);
                return;
            }
            fs.read(fd, buffer, 0, size, demanderPoint, (err, bytesRead, buffer) => {
                if (err) {
                    MCSERVER.log('实例', this.id, '日志历史记录文件读取错误:', err.message);
                    return;
                };
                const logText = buffer.slice(0, bytesRead).toString();
                this.readPoints[demander] += size;
                callback && callback(logText);
                // 关闭文件
                fs.close(fd, () => { });
            });
        });
    }

    readLineReverse(demander = "", size = 1024, notadd = false, callback = () => { }) {
        if (!this.readPoints[demander]) {
            this.readPoints[demander] = 0;
        }
        const demanderPoint = this.readPoints[demander];
        const buffer = Buffer.alloc(size);
        fs.open(this.path, 'r', (err, fd) => {
            if (err) {
                MCSERVER.log('实例', this.id, '日志历史记录文件打开错误:', err.message);
                return;
            }
            fs.read(fd, buffer, 0, size, demanderPoint, (err, bytesRead, buffer) => {
                if (err) {
                    MCSERVER.log('实例', this.id, '日志历史记录文件读取错误:', err.message);
                    return;
                };
                const logText = buffer.slice(0, bytesRead).toString();
                this.readPoints[demander] += size;
                callback && callback(logText);
                // 关闭文件
                fs.close(fd, () => { });
            });
        });
        if (!notadd) this.readPoints[demander] = demanderPoint + size;
    }

    setPoint(demander, v) {
        this.readPoints[demander] = v;
    }
}

module.exports = {
    LogHistory
}