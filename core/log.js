const log4js = require("log4js");
log4js.configure({
    appenders: {
        out: {
            type: 'stdout', layout: {
                type: 'pattern',
                pattern: '[%d{MM/dd hh:mm:ss}] [%[%p%]] %m'
            }
        },
        app: {
            type: 'file', filename: 'application.log', layout: {
                type: 'pattern',
                pattern: '%d %p %m'
            }
        }
    },
    categories: {
        default: {
            appenders: ['out', 'app'], level: 'info'
        }
    }
});

const logger = log4js.getLogger("default");

MCSERVER.log = function () {
    let str = "";
    for (let i = 0; i < arguments.length; i++) {
        str += arguments[i] + ' ';
    }
    MCSERVER.infoLog('INFO', str);
}

MCSERVER.infoLog = (info = "", value = "", colors = false) => {
    let msg = value;
    if (info.toUpperCase() != 'INFO') {
        msg = [info, '-', value].join(' ');
    }
    logger.info(msg);
}

//error 报告器
MCSERVER.error = (msg, err) => {
    logger.error(msg);
    logger.error(err);
}


MCSERVER.warning = (title, msg = null) => {
    logger.warn(msg);
}
