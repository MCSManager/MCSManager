const childProcess = require('child_process');
const iconv = require('iconv-lite');
const EventEmitter = require('events');

const DataModel = require('../DataModel');
const os = require('os');

var CODE_CONSOLE = MCSERVER.localProperty.console_encode;

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

    //自定义高级参数启动
    twoStart() {
        MCSERVER.infoLog('Minecraft Server start', this.dataModel.name);
        MCSERVER.log('服务器 [' + this.dataModel.name + '] 启动进程:')
        MCSERVER.log('-------------------------------');
        MCSERVER.log('自定义参数启动: ' + this.dataModel.highCommande);
        MCSERVER.log('根:' + this.dataModel.cwd);
        MCSERVER.log('-------------------------------');

        if (!this.highCommande) new Error("自定义参数非法,无法启动服务端");
        let commandArray = this.dataModel.highCommande.split(" ");
        let javaPath = commandArray.shift();
        //过滤
        let parList = [];
        for (let k in commandArray) {
            if (commandArray[k] == '') continue;
            parList.push(commandArray[k]);
        }

        this.process =
            childProcess.spawn(javaPath, parList, this.ProcessConfig);
    }

    //普通启动
    oneStart() {
        let tmpAddList = [];
        let tmpShouldList = [];

        this.dataModel.Xmx && tmpShouldList.push('-Xmx' + this.dataModel.Xmx);
        this.dataModel.Xms && tmpShouldList.push('-Xms' + this.dataModel.Xms);
        tmpShouldList.push('-Djline.terminal=jline.UnsupportedTerminal');
        tmpShouldList.push('-jar');
        tmpShouldList.push(this.dataModel.jarName);

        tmpAddList = this.dataModel.addCmd.concat(tmpShouldList);
        //过滤
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

        this.process = childProcess.spawn(this.dataModel.java, parList, this.ProcessConfig);
    }

    start() {
        //防止重复启动
        if (this._run || this._loading) throw new Error('服务端进程在运行或正在加载..');

        this._loading = true;

        let jarPath = (this.dataModel.cwd + '/' + this.dataModel.jarName).replace(/\/\//igm, '/');

        //选择启动方式 自定义命令与配置启动
        if (!this.dataModel.highCommande) {
            //只在非自定义模式下检查参数
            if (!fs.existsSync(this.dataModel.cwd)) {
                this.stop();
                throw new Error('服务端根目录 "' + jarPath + '" 不存在!');
            }
            if (this.dataModel.jarName.trim() == '') {
                this.stop();
                throw new Error('未设置服务端核心文件,无法启动服务器');
            }
            if (!fs.existsSync(jarPath)) {
                this.stop();
                throw new Error('服务端文件 "' + jarPath + '" 不存在或错误!');
            }

        } else {
            //自定义模式检查
            //检查是否准许自定义命令
            if (!MCSERVER.localProperty.customize_commande) {
                this.stop();
                throw new Error('操作禁止！管理员禁止服务器使用自定义命令！');
            }
        }

        this.ProcessConfig = {
            cwd: this.dataModel.cwd,
            stdio: 'pipe'
        }

        try {
            //确定启动方式
            this.dataModel.highCommande ? this.twoStart() : this.oneStart();
        } catch (err) {
            this.stop();
        }

        this._run = true;
        this._loading = false;
        this.dataModel.lastDate = new Date().toLocaleString();

        this.process.on('error', (err) => {
            MCSERVER.error('服务器启动时保存,建议检查配置与环境', err);
            this.stop();
            this.emit('error', err);
        });

        if (this.process.pid == undefined) {
            MCSERVER.error('this.process.pid is null', this.process.pid);
            this.stop();
            delete this.process;
            throw new Error('服务端进程启动失败，请检查启动参数');
            return false;
        }

        // 事件的传递
        this.process.stdout.on('data', (data) => this.emit('console', iconv.decode(data, CODE_CONSOLE)));
        this.process.stderr.on('data', (data) => this.emit('console', iconv.decode(data, CODE_CONSOLE)));
        this.process.on('exit', (code) => {
            this.emit('exit', code);
            this.stop();
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

    stop() {
        this._run = false;
        this._loading = false;
        this.send('stop');
        this.send('end');

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

module.exports = ServerProcess;