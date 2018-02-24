const ServerProcess = require('./BaseMcserver');
const DataModel = require('../DataModel');
const os = require('os');

const properties = require("properties");
const fs = require('fs');

class MinecraftServer extends ServerProcess {

    constructor(name, args) {
        super(args);
        //这是配置文件
        this.dataModel = new DataModel('server/' + name);
        let now = new Date().toLocaleString();

        this.dataModel.name = name; //服务器名字
        this.dataModel.createDate = now; //创建时间
        this.dataModel.lastDate = now; //最后启动时间
        this.dataModel.autoRestart = false; //是否自动重启

        this.properties = undefined; //服务端配置表

        this.terminalQueue = []; //终端记录队列
        this._tmpTerminalLog = [];
        this.terminalPageCount = 0;
    }

    builder(args) {
        this.dataModel.addCmd = args.addCmd || [];

        this.dataModel.java = args.java || 'java';
        this.dataModel.jarName = args.jarName;

        this.dataModel.Xmx = args.Xmx;
        this.dataModel.Xms = args.Xms;

        //cwd 是服务端文件，不是控制面板需要的配置
        this.dataModel.cwd = args.cwd || './server/' + this.dataModel.name + '/';

        //自定义参数
        let tmpCommandeStart = args.highCommande || "";
        //自定义参数去掉所有两个空格
        tmpCommandeStart = tmpCommandeStart.replace(/  /igm, ' ');
        this.dataModel.highCommande = tmpCommandeStart;


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
        properties.parse(this.dataModel.cwd + '/server.properties', {
            path: true
        }, (err, obj) => {

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
        if (this.terminalQueue.length > MCSERVER.localProperty.terminalQueue_max_length) {
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