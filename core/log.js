//log 输出标准

MCSERVER.log = function () {
    let str = "";
    for (let i = 0; i < arguments.length; i++) {
        str += arguments[i] + ' ';
    }
    MCSERVER.infoLog('INFO', str);
}

MCSERVER.infoLog = (info, value, colors = false) => {
    let infoStr = colors ? info : info.green;
    console.log('[ ' + infoStr + ' ]  ' + (value + '').white);
}

//error 报告器
MCSERVER.error = (msg, err) => {
    let header = 'ERROR';
    MCSERVER.infoLog(header.red, '\n--------Error-------\n', true);
    MCSERVER.infoLog(header.red, msg.yellow, true);
    console.log(err);
    console.log("--------Error-------\n");
}


MCSERVER.warning = (title, msg = null) => {
    MCSERVER.infoLog('WARN'.yellow, title.white);
    if (msg) {
        MCSERVER.infoLog('WARN'.yellow, msg.white);
    }

}