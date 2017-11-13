// Pipe
const childProcess = require('child_process');
const iconv = require('iconv-lite');
const EventEmitter = require('events');

const DataModel = require('../DataModel');
const os = require('os');

var CODE_CONSOLE = 'GBK';
if (os.platform() == 'win32') {
    CODE_CONSOLE = 'GBK';
} else {
    CODE_CONSOLE = 'UTF-8';
}

//https://github.com/Gagle/Node-Properties
const properties = require("properties");
const fs = require('fs');

class ServerProcess extends EventEmitter {

    constructor(args) {
        super(args)
        this.dataModel = undefined;
        this.process = undefined;
        this._run = false;
        //用于异步进行的锁
        this._loading = false;

    }

    start() {
        //防止重复启动
        if (this._run || this._loading) return false;

        this._loading = true;

        let jarPath = (this.dataModel.cwd + '/' + this.dataModel.jarName).replace(/\/\//igm, '/');

        if (!fs.existsSync(this.dataModel.cwd)) {
            this._run = false;
            this._loading = false;
            throw new Error('服务端根目录 "' + jarPath + '" 不存在!');
        }
        if (this.dataModel.jarName.trim() == '') {
            this._run = false;
            this._loading = false;
            throw new Error('未设置服务端核心文件,无法启动服务器');
        }
        if (!fs.existsSync(jarPath)) {
            this._run = false;
            this._loading = false;
            throw new Error('服务端文件 "' + jarPath + '" 不存在或错误!');
        }
       

        this.ProcessConfig = {
            cwd: this.dataModel.cwd,
            stdio: 'pipe'
        }

        let tmpAddList = [];
        let tmpShouldList = [];
        if (this.dataModel.Xmx) {
            tmpShouldList = tmpShouldList.concat([
                '-Xmx' + this.dataModel.Xmx
            ]);
        }
        if (this.dataModel.Xms) {
            tmpShouldList = tmpShouldList.concat([
                '-Xms' + this.dataModel.Xms
            ]);
        }
        tmpShouldList = tmpShouldList.concat([
            '-Djline.terminal=jline.UnsupportedTerminal', '-jar',
            this.dataModel.jarName
        ]);

        tmpAddList = this.dataModel.addCmd.concat(tmpShouldList);

        let parList = [];
        for (let k in tmpAddList) {
            if (tmpAddList[k] == '') continue;
            parList.push(tmpAddList[k]);
        }

        MCSERVER.infoLog('Minecraft Server start', this.dataModel.name);
        MCSERVER.log('服务器 [' + this.dataModel.name + '] 启动进程:')
        MCSERVER.log('-------------------------------');
        MCSERVER.log('启动: ' + this.dataModel.java + ' ' + parList.toString().replace(/,/gim, ' '));
        MCSERVER.log('根:' + this.dataModel.cwd);
        MCSERVER.log('-------------------------------');

        this.process = childProcess.spawn(this.dataModel.java || 'java', parList || [], this.ProcessConfig);

        this._run = true;
        this._loading = false;
        this.dataModel.lastDate = new Date().toLocaleString();

        this.process.on('error', (err) => {
            MCSERVER.error('服务器启动时保存,建议检查配置与环境', err);
            this._run = false;
            this._loading = false;
            this.emit('error', err);
        });

        if (this.process.pid == undefined) {
            MCSERVER.error('this.process.pid is null',this.process.pid);
            this._run = false;
            this._loading = false;
            delete this.process;
            throw new Error('服务端进程启动失败，请检查启动参数');
            return false;
        }

        // 事件的传递
        this.process.stdout.on('data', (data) => this.emit('console', iconv.decode(data, CODE_CONSOLE)));
        this.process.stderr.on('data', (data) => this.emit('console', iconv.decode(data, CODE_CONSOLE)));
        this.process.on('exit', (code) => {
            this.emit('exit', code);
            this._run = false;
        });
        //产生事件开启
        this.emit('open', this);

        return true;
    }

    send(command) {
        if (this._run) {
            this.process.stdin.write(iconv.encode(command, CODE_CONSOLE));
            this.process.stdin.write('\n');
            return true;
        }
        return true;
    }

    restart() {
        if (this._run == true) {
            this.send('stop');
            this.send('end');

            //开始计时重启
            let timeCount = 0;
            let timesCan = setInterval(() => {
                if (this._run == false) {
                    setTimeout(() => this.start(), 1000);
                    clearInterval(timesCan);
                }
                //60s 内服务器依然没有关闭，代表出现问题
                if (timeCount >= 60) {
                    clearInterval(timesCan)
                }
                timeCount++;

            }, 1000);

            return true;
        }
    }

    kill() {
        if (this._run) {
            this.process.kill();
            this._run = false;
            return true;
        }
        return false;
    }

    isRun() {
        return this._run;
    }

}


class MinecraftServer extends ServerProcess {

    constructor(name, args) {
        super(args);
        //这是配置文件
        this.dataModel = new DataModel('server/' + name);
        let now = new Date().toLocaleString();
        this.dataModel.name = name;
        this.dataModel.createDate = now;
        this.dataModel.lastDate = now;

        this.properties = undefined;

        this.terminalQueue = [];
        this._tmpTerminalLog = [];
        this.terminalPageCount = 0;
    }

    builder(args) {
        this.dataModel.addCmd = args.addCmd || ['-server', '-Xincgc'];
        this.dataModel.java = args.java || 'Java';
        this.dataModel.jarName = args.jarName;
        this.dataModel.Xmx = args.Xmx;
        this.dataModel.Xms = args.Xms;
        //cwd 是服务端文件，不是控制面板需要的配置
        this.dataModel.cwd = args.cwd || './server/' + this.dataModel.name + '/';
        this.propertiesLoad();

    }

    load() {
        this.dataModel.load();
        this.builder(this.dataModel);

    }

    save() {
        this.dataModel.save();
    }

    propertiesLoad(callback) {
        //配置读取
        properties.parse(this.dataModel.cwd + '/server.properties', { path: true }, (err, obj) => {

            //箭头函数this 并且这个不需要保存到配置文件，所以不应该在datamodel
            this.properties = obj;
            callback && callback(this.properties, err);
        });
    }

    propertiesSave(newProperties, callback) {
        //解析
        let text = properties.stringify(newProperties);
        // 写入数据, 文件不存在会自动创建
        fs.writeFile(this.dataModel.cwd + '/server.properties', text, (err) => {
            this.propertiesLoad(() => {
                callback && callback(this.properties, err);
            });
        });
    }

    terminalLog(strLine) {
        this.terminalQueue.push(strLine);
        if (this.terminalQueue.length > 512) {
            this.terminalQueue = this.terminalQueue.slice(400);
        }
    }

    getTerminalLog(print, size) {
        if (print == undefined)
            return this.terminalQueue || [];
        let tmp = [];
        for (let i = print; i > (print - size) && i >= 0; i--) {
            tmp.unshift(this.terminalQueue[i]);
        }
        return tmp;
    }

}

module.exports = MinecraftServer;