const fs = require("fs");
const readline = require('readline');
class RecordCommand {
    constructor(path = "") {
        this.path = path;
        this.timerlock = false;
    }

    writeRecord(data = "") {
        fs.appendFile(this.path, data, 'utf8', function (err) {});
    }

    readRecord(start = 0, end = -1, callback = () => {}) {
        let fRead = fs.createReadStream(this.path);
        let tmpbuff = "";
        let freadline = readline.createInterface({
            input: fRead
        });
        freadline.on('close', () => {
            callback(tmpbuff);
        });
        var i = 0;
        freadline.on('line', (line) => {
            //间距
            if (end < 0) {
                if (i < start) {
                    i++;
                    return;
                }
            } else {
                if (i < start || i >= end) {
                    i++;
                    return;
                }
            }
            tmpbuff += line + "\n";
            i++;
        });
    }
}