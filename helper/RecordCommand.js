const fs = require("fs");
const readline = require('readline');

const LOAD_SIZE = 32;

//默认目录 RecordTmp
class RecordCommand {

    constructor(path = "") {
        this.path = path;
        this.timerlock = false;
    }

    // 获取当前这一刻的 log 文本文件大小
    // 可以定位当前日志起始位置
    recordLength() {
        let fsstat = fs.statSync(this.path);
        return fsstat.size;
    }

    // 向最后追加一行或一堆数据
    writeRecord(data = "") {
        if (fs.existsSync(this.path))
            fs.appendFile(this.path, data, 'utf8', function (err) {});
        else
            fs.writeFileSync(this.path, data);
    }

    readRecord(pstart = 0, length = 32, callback = (logStr) => {}) {
        const fsstat = fs.statSync(this.path);
        const filesize = fsstat.size;

        let buffer = new Buffer(length);

        // Start Read from file
        fs.open(this.path, 'r', function (err, fd) {
            if (err) throw err;

            if (pstart >= filesize || pstart <= 0)
                return

            // 读取文件
            fs.read(fd, buffer, 0, length, pstart, function (err, bytesRead, buffer) {
                if (err) throw err;

                // 打印出buffer中存入的数据
                let resStr = buffer.slice(0, bytesRead).toString();
                callback(resStr);

                console.log(bytesRead, buffer.slice(0, bytesRead).toString());
                console.log("\n")

                // 关闭文件
                fs.close(fd, () => {});
            });

        });
    }

    // readRecord(start = 0, end = -1, callback = () => {}) {
    //     let fRead = fs.createReadStream(this.path);
    //     let tmpbuff = "";
    //     let freadline = readline.createInterface({
    //         input: fRead
    //     });
    //     freadline.on('close', () => {
    //         callback(tmpbuff);
    //     });
    //     var i = 0;
    //     freadline.on('line', (line) => {
    //         //间距
    //         if (end < 0) {
    //             if (i < start) {
    //                 i++;
    //                 return;
    //             }
    //         } else {
    //             if (i < start || i >= end) {
    //                 i++;
    //                 return;
    //             }
    //         }
    //         tmpbuff += line + "\n";
    //         i++;
    //     });
    // }
}


module.exports.RecordCommand = RecordCommand;