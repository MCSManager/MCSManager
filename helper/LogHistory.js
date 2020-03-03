"use strict";
// 日志历史储存

const MAX_HISTORY_SIZE = 1000;
const DELETE_ALTER_INIT_SIZE = 600;

class LogHistory {
    constructor(id) {
        this.id = id;
        this.readPoints = {};
        this.log = new Array();
    }

    writeLine(text = "") {
        if (text.length == 0) return;
        if (this.log.length > MAX_HISTORY_SIZE) {
            this.log.splice(0, DELETE_ALTER_INIT_SIZE);
        }
        let addLineLength = 0;
        text = text.replace(/\r/igm, "");
        if (text.indexOf('\n') != -1) {
            let arr = text.split('\n');
            for (let v of arr) {
                if (v) {
                    this.log.push(v);
                    addLineLength++;
                }
            }
        } else {
            this.log.push(text);
            addLineLength++;
        }
        for (let k in this.readPoints) {
            this.readPoints[k] += addLineLength;
        }
    }

    readLine(demander = "", size = 10) {
        if (!this.readPoints[demander]) {
            this.readPoints[demander] = 0;
        }
        let demanderPoint = this.readPoints[demander];
        let text = "";
        let logarr = this.log;
        let i;
        for (i = demanderPoint; i <= demanderPoint + size; i++) {
            let point = logarr.length - i - 1;
            if (point < 0) break;
            let v = logarr[point] + '\n';
            if (logarr[point] && logarr[point].trim().length > 0) text += v;
        }
        this.readPoints[demander] = demanderPoint + size;
        return text;
    }

    readLineReverse(demander = "", size = 10, notadd = false) {
        if (!this.readPoints[demander]) {
            this.readPoints[demander] = 0;
        }
        let demanderPoint = this.readPoints[demander];
        let text = "";
        let logarr = this.log;
        let i;
        for (i = (logarr.length - 1 - size - demanderPoint); i < logarr.length - demanderPoint; i++) {
            let v = logarr[i] + '\n';
            if (logarr[i] && logarr[i].trim().length > 0) text += v;
        }
        if (!notadd) this.readPoints[demander] = demanderPoint + size;
        return text;
    }

    setPoint(demander, v) {
        this.readPoints[demander] = v;
    }
}

module.exports = {
    LogHistory
}