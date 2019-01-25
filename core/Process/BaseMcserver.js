const childProcess = require('child_process');
const iconv = require('iconv-lite');
const EventEmitter = require('events');

const DataModel = require('../DataModel');
const os = require('os');
const tools = require('../tools');
const permission = require('../../helper/Permission');
const path = require('path')

const properties = require("properties");
const fs = require('fs');

var CODE_CONSOLE = MCSERVER.localProperty.console_encode;

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
    customCommandStart() {

        //暂时使用 MCSMERVER.log 目前已弃用，下版本 log4js
        MCSERVER.infoLog('Minecraft Server start', this.dataModel.name);
        MCSERVER.log(['服务器 [', this.dataModel.name, '] 启动进程:'].join(" "));
        MCSERVER.log('-------------------------------');
        MCSERVER.log(['自定义参数启动: ', this.dataModel.highCommande].join(" "));
        MCSERVER.log(['根:', this.dataModel.cwd].join(" "));
        MCSERVER.log('-------------------------------');

        if (!this.dataModel.highCommande || this.dataModel.highCommande.trim().length <= 0)
            new Error("自定义参数非法,无法启动服务端");
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
    templateStart(onlyCommandString = false) {
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

        let commandString = this.dataModel.java + ' ' + parList.toString().replace(/,/gim, ' ');

        //是否只获取命令字符串
        if (onlyCommandString) return commandString;

        //暂时使用 MCSMERVER.log 目前已弃用，下版本 log4js
        MCSERVER.infoLog('Minecraft Server start', this.dataModel.name);
        MCSERVER.log(['服务器 [', this.dataModel.name, '] 启动进程:'].join(" "))
        MCSERVER.log('-------------------------------');
        MCSERVER.log(['启动: ', commandString].join(" "));
        MCSERVER.log(['根:', this.dataModel.cwd].join(" "));
        MCSERVER.log('-------------------------------');

        this.process = childProcess.spawn(this.dataModel.java, parList, this.ProcessConfig);
    }

    //使用 Docker 命令启动
    dockerStart() {
        //命令模板与准备数据
        let dockerCommand = this.dataModel.dockerConfig.dockerCommand;
        // let processCwd = process.cwd();
        let stdCwd = path.resolve(this.dataModel.cwd).replace(/\\/igm, "/");

        //命令模板渲染
        if (this.dataModel.highCommande.trim() != "")
            dockerCommand = dockerCommand.replace(/\$\{commande\}/igm, this.dataModel.highCommande);
        else
            dockerCommand = dockerCommand.replace(/\$\{commande\}/igm, this.templateStart(true));
        //加入镜像名
        dockerCommand = dockerCommand.replace(/\$\{imagename\}/igm,
            this.dataModel.dockerConfig.dockerImageName);
        //加入端口限制
        dockerCommand = dockerCommand.replace(/\$\{ports\}/igm,
            this.dataModel.dockerConfig.dockerPorts ? "-p " + this.dataModel.dockerConfig.dockerPorts : "");
        //加入服务端绝对路径
        dockerCommand = dockerCommand.replace(/\$\{serverpath\}/igm,
            tools.CharReplaceTemp(stdCwd, " "));
        //加入最大内存限制
        dockerCommand = dockerCommand.replace(/\$\{xmx\}/igm,
            this.dataModel.dockerConfig.dockerXmx ? "-m " + this.dataModel.dockerConfig.dockerXmx : "");

        //格式替换
        let dockerCommandPart = dockerCommand.replace(/  /igm, " ").split(" ");

        //分割的参数全部渲染
        // for (let k in dockerCommandPart) { }

        let execDockerCommande = [];
        for (let i = 1; i < dockerCommandPart.length; i++) {
            if (dockerCommandPart[i].trim() != "") execDockerCommande.push(tools.TempReplaceChar(dockerCommandPart[i], " "));
        }

        //暂时使用 MCSMERVER.log 目前已弃用，下版本 log4js
        MCSERVER.infoLog('Minecraft Server start (Docker)', this.dataModel.name);
        MCSERVER.log('端实例 [' + this.dataModel.name + '] 启动 Docker 容器:');
        MCSERVER.log('-------------------------------');
        MCSERVER.log('启动命令: ' + dockerCommandPart[0] + " " + execDockerCommande.join(" "));
        MCSERVER.log('根:' + stdCwd);
        MCSERVER.log('-------------------------------');

        this.process = childProcess.spawn(dockerCommandPart[0], execDockerCommande, this.ProcessConfig);

        this.send(this.dataModel.highCommande || this.templateStart(true));
    }

    //统一服务端开启
    start() {
        //服务端时间权限判断
        let timeResult = this.isDealLineDate();
        if (timeResult) {
            throw new Error('服务端于 ' + this.dataModel.timeLimitDate + ' 时间已到期，拒绝启动，请咨询管理员。');
        }

        //防止重复启动
        if (this._run || this._loading) throw new Error('服务端进程在运行或正在加载..');

        this._loading = true;

        let jarPath = this.dataModel.jarName;
        if (!path.isAbsolute(jarPath)) {
            jarPath = (this.dataModel.cwd + '/' + this.dataModel.jarName)
        }
        jarPath = jarPath.replace(/\/\//igm, '/');

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
            if (this.dataModel.dockerConfig.isDocker) {
                //Docker 启动
                this.dockerStart();
            } else {
                //确定启动方式
                this.dataModel.highCommande ? this.customCommandStart() : this.templateStart();
            }
        } catch (err) {
            this.stop();
            throw new Error('进程启动时异常:' + err.name + ":" + err.message);
        }

        this._run = true;
        this._loading = false;
        this.dataModel.lastDate = new Date().toLocaleString();

        this.process.on('error', (err) => {
            MCSERVER.error('服务器启动时异常,建议检查配置与环境', err);
            this.printlnStdin(['Error:', err.name, '\n Error Message:', err.message, '\n 进程 PID:', this.process.pid || "启动失败，无法获取进程。"]);
            this.stop();
            this.emit('error', err);
        });

        if (!this.process.pid) {
            MCSERVER.error('this.process.pid is null', this.process.pid);
            this.stop();
            delete this.process;
            throw new Error('服务端进程启动失败，请检查启动参数。进程 PID 是 Null！');
        }

        // 输出事件的传递
        this.process.stdout.on('data', (data) => this.emit('console', iconv.decode(data, this.dataModel.oe)));
        this.process.stderr.on('data', (data) => this.emit('console', iconv.decode(data, this.dataModel.oe)));
        this.process.on('exit', (code) => {
            this.emit('exit', code);
            this.stop();
        });

        // 产生事件开启
        this.emit('open', this);

        // 输出开服资料
        this.printlnCommandLine('服务端 ' + this.dataModel.name + " 执行开启命令. PID:" + this.process.pid);
        return true;
    }

    send(command) {
        if (this._run) {
            this.process.stdin.write(iconv.encode(command, this.dataModel.ie));
            this.process.stdin.write('\n');
            return true;
        }
        return true;
    }

    restart() {
        if (this._run == true) {
            this.send('stop');
            this.send('end');
            this.send('exit');

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
        this.send('exit');
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

    //输出一行到标准输出
    printlnStdin(line) {
        let str = ['[MCSMANAGER] [', tools.getFullTime(), ']:',
            line,
            "\n"
        ].join(" ");
        this.emit('console', str);
    }

    printlnCommandLine(line) {
        this.emit('console', "[MCSMANAGER] -------------------------------------------------------------- \n");
        this.printlnStdin(line);
        this.emit('console', "[MCSMANAGER] -------------------------------------------------------------- \n");
    }

    isDealLineDate() {
        let timeResult = permission.isTimeLimit(this.dataModel.timeLimitDate);
        return timeResult;
    }

}

module.exports = ServerProcess;