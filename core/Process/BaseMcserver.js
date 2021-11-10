const process = require("process");
const processUserUid = process.getuid;
const processGroupGid = process.getgid;

const childProcess = require("child_process");
const iconv = require("iconv-lite");
const EventEmitter = require("events");

const tools = require("../tools");
const permission = require("../../helper/Permission");
const path = require("path");

const fs = require("fs");
const os = require("os");
const Docker = require("dockerode");
const { exec } = require("child_process");

class ServerProcess extends EventEmitter {
  constructor(args) {
    super(args);
    this.dataModel = undefined;
    this.process = undefined;
    this._run = false;
    //用于异步进行的锁
    this._loading = false;
    this._processType = 1; // 1=正常进程，2=容器
  }

  // 自定义命令启动方式
  customCommandStart() {
    // 设置启动进程的类型
    this._processType = 1;

    MCSERVER.infoLog("Minecraft Server start", this.dataModel.name);
    MCSERVER.log(["服务器 [", this.dataModel.name, "] 启动进程:"].join(" "));
    MCSERVER.log("-------------------------------");
    MCSERVER.log(["自定义参数启动: ", this.dataModel.highCommande].join(" "));
    MCSERVER.log(["根:", this.dataModel.cwd].join(" "));
    MCSERVER.log("-------------------------------");

    if (!this.dataModel.highCommande || this.dataModel.highCommande.trim().length <= 0) throw new Error("自定义参数非法,无法启动服务端");
    let commandArray = this.dataModel.highCommande.split(" ");
    let javaPath = commandArray.shift();
    //过滤
    let parList = [];
    for (let k in commandArray) {
      if (commandArray[k] == "") continue;
      parList.push(commandArray[k]);
    }

    this.process = childProcess.spawn(javaPath, parList, this.ProcessConfig);
  }

  // 标准 Java 程序启动方式
  templateStart(onlyCommandString = false) {
    let tmpAddList = [];
    let tmpShouldList = [];
    this.dataModel.Xmx && tmpShouldList.push("-Xmx" + this.dataModel.Xmx);
    this.dataModel.Xms && tmpShouldList.push("-Xms" + this.dataModel.Xms);
    tmpShouldList.push("-Djline.terminal=jline.UnsupportedTerminal");
    tmpShouldList.push("-jar");
    tmpShouldList.push(this.dataModel.jarName);
    tmpShouldList.push("nogui");

    tmpAddList = this.dataModel.addCmd.concat(tmpShouldList);
    //过滤
    let parList = [];
    for (let k in tmpAddList) {
      if (tmpAddList[k] == "") continue;
      parList.push(tmpAddList[k]);
    }

    let commandString = this.dataModel.java + " " + parList.toString().replace(/,/gim, " ");

    //是否只获取命令字符串
    if (onlyCommandString) return commandString;

    // 设置启动进程的类型
    this._processType = 1;

    //暂时使用 MCSMERVER.log 目前已弃用，下版本 log4js
    MCSERVER.infoLog("Minecraft Server start", this.dataModel.name);
    MCSERVER.log(["服务器 [", this.dataModel.name, "] 启动进程:"].join(" "));
    MCSERVER.log("-------------------------------");
    MCSERVER.log(["启动: ", commandString].join(" "));
    MCSERVER.log(["根:", this.dataModel.cwd].join(" "));
    MCSERVER.log("-------------------------------");

    this.process = childProcess.spawn(this.dataModel.java, parList, this.ProcessConfig);
  }

  //使用 Docker API 启动进程
  async dockerStart() {
    // 命令模板与准备数据
    let stdCwd = path.resolve(this.dataModel.cwd).replace(/\\/gim, "/");

    // 采用 Docker API 进行启动与监控
    // 启动命令解析
    let startCommande = "";
    if (this.dataModel.highCommande.trim() != "") startCommande = this.dataModel.highCommande;
    else startCommande = this.templateStart(true);
    const startCommandeArray = startCommande.split(" ");
    let portmap = this.dataModel.dockerConfig.dockerPorts;
    // 端口解析
    var ports = portmap.split("|");
    // 绑定内部暴露端口
    const ExposedPortsObj = {};
    // 绑定内部暴露端口与其对应的宿主机端口
    const PortBindingsObj = {};
    for (var portstr of ports) {
      var agreement = portstr.split("/");
      var protocol = "tcp";
      if (agreement.length >= 2 && (agreement[1] === "udp" || agreement[1] === "tcp")) {
        protocol = agreement[1];
      }
      var port = portstr.split(":");
      if (port.length > 2) {
        throw new Error("参数配置端口映射错误。");
      }
      if (port.length == 2) {
        // 一个端口的配置项目
        ExposedPortsObj[port[0] + "/" + protocol] = {};
        PortBindingsObj[port[0] + "/" + protocol] = [
          {
            HostPort: port[1] + "",
          },
        ];
      }
    }
    // 输出启动消息
    MCSERVER.log("实例 [", this.dataModel.name, "] 正在启动...");
    MCSERVER.log("-------------------------------");
    MCSERVER.log("正在使用虚拟化技术启动进程");
    MCSERVER.log("命令:", startCommandeArray.join(" "));
    MCSERVER.log("开放端口:", portmap);
    MCSERVER.log("工作目录:", stdCwd);
    MCSERVER.log("-------------------------------");

    // 设置启动进程的类型
    this._processType = 2;

    // 模拟一个正常的 Process
    this.process = new EventEmitter();
    const process = this.process;
    const self = this;

    // 基于镜像启动虚拟化容器
    const docker = new Docker();
    let auxContainer = null;
    auxContainer = await docker.createContainer({
      Image: this.dataModel.dockerConfig.dockerImageName,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: startCommandeArray,
      OpenStdin: true,
      StdinOnce: false,
      User: `${processUserUid()}:${processGroupGid()}`,
      ExposedPorts: ExposedPortsObj,
      HostConfig: {
        Binds: [stdCwd + ":/mcsd/"],
        Memory: this.dataModel.dockerConfig.dockerXmx * 1024 * 1024 * 1024,
        PortBindings: PortBindingsObj,
      },
    });
    try {
      // 尝试启动容器
      await auxContainer.start();
    } catch (err) {
      this.stop();
      this.emit("exit", 0);
      throw new Error("实例进程启动失败，建议检查启动参数与设置");
    }

    // 链接容器的输入输出流
    // 并且模拟成一个类 Process 进程
    auxContainer.attach(
      {
        stream: true,
        stdin: true,
        stdout: true,
      },
      (err, stream) => {
        if (err) throw err;
        // 赋值进程容器
        process.dockerContainer = auxContainer;
        // 模拟 pid
        process.pid = auxContainer.id;
        // 对接普通进程的输入输出流
        process.stdin = stream;
        process.stdout = stream;
        process.stderr = null;
        // 模拟进程杀死功能
        process.kill = () => {
          auxContainer.kill().then(() => {
            auxContainer.remove().then(() => {
              MCSERVER.log("实例", "[", self.dataModel.name, "]", "容器已强制移除");
            });
          });
        };
        // 容器工作完毕退出事件
        auxContainer.wait(() => {
          self.emit("exit", 0);
          self.stop();
          auxContainer.remove();
        });
        // 容器流错误事件传递
        stream.on("error", (err) => {
          MCSERVER.error("服务器运行时异常,建议检查配置与环境", err);
          self.printlnStdin(["Error:", err.name, "\n Error Message:", err.message, "\n 进程 PID:", self.process.pid || "启动失败，无法获取进程。"]);
          self.stop();
          self.emit("error", err);
        });
        // 判断启动是否成功
        if (!process.pid) {
          MCSERVER.error("服务端进程启动失败，建议检查启动命令与参数是否正确");
          self.stop();
          auxContainer.remove();
          throw new Error("服务端进程启动失败，建议检查启动命令与参数是否正确");
        }

        // 开启启动状态
        self._run = true;
        self._loading = false;
        self.dataModel.lastDate = new Date().toLocaleString();

        // 输出事件的传递
        process.stdout.on("data", (data) => self.emit("console", iconv.decode(data, self.dataModel.oe)));

        // 产生事件开启
        self.emit("open", self);

        // 输出开服资料
        self.printlnCommandLine("服务端 " + self.dataModel.name + " 执行开启命令.");
      }
    );
  }

  // 统一服务端开启入口
  // 不论是通过哪种方式启动，必须从这个入口进入，再根据不同配置进行分支
  start() {
    // 服务端时间权限判断
    let timeResult = this.isDealLineDate();
    if (timeResult) {
      throw new Error("服务端于 " + this.dataModel.timeLimitDate + " 时间已到期，拒绝启动，请咨询管理员。");
    }

    // 防止重复启动
    if (this._run || this._loading) throw new Error("服务端进程在运行或正在加载..");

    this._loading = true;

    let jarPath = this.dataModel.jarName;
    if (!path.isAbsolute(jarPath)) {
      jarPath = this.dataModel.cwd + "/" + this.dataModel.jarName;
    }
    jarPath = jarPath.replace(/\/\//gim, "/");

    // 选择启动方式 自定义命令与配置启动
    if (!this.dataModel.highCommande) {
      // 只在非自定义模式下检查参数
      if (!fs.existsSync(this.dataModel.cwd)) {
        this.stop();
        throw new Error('服务端根目录 "' + jarPath + '" 不存在!');
      }
      if (this.dataModel.jarName.trim() == "") {
        this.stop();
        throw new Error("未设置服务端核心文件,无法启动服务器");
      }
      if (!fs.existsSync(jarPath)) {
        this.stop();
        throw new Error('服务端文件 "' + jarPath + '" 不存在或错误!');
      }
    } else {
      // 自定义模式检查
      // 检查是否准许自定义命令
      if (!MCSERVER.localProperty.customize_commande) {
        this.stop();
        throw new Error("操作禁止！管理员禁止服务器使用自定义命令！");
      }
    }

    this.ProcessConfig = {
      cwd: this.dataModel.cwd,
      stdio: "pipe",
    };

    try {
      if (this.dataModel.dockerConfig.isDocker) {
        // Docker 启动，异步函数
        // 选用虚拟化技术启动后，将不再执行下面代码逻辑，由专属的进程启动方式启动。
        this.dockerStart().then(undefined, (error) => {
          // Docker 启动时异常处理
          MCSERVER.error("此服务器启动时异常,具体错误信息:", error);
          this.printlnCommandLine("进程实例启动时失败，建议检查配置文件与启动参数");
          this.stop();
        });
        // 阻止继续运行下去
        return true;
      } else {
        // 确定是自定义命令启动还是模板正常方式启动。
        this.dataModel.highCommande ? this.customCommandStart() : this.templateStart();
      }
    } catch (err) {
      this.stop();
      throw new Error("进程启动时异常:" + err.name + ":" + err.message);
    }

    // 设置启动状态
    this._run = true;
    this._loading = false;
    this.dataModel.lastDate = new Date().toLocaleString();

    // 进程事件监听
    this.process.on("error", (err) => {
      MCSERVER.error("服务器运行时异常,建议检查配置与环境", err);
      this.printlnStdin(["Error:", err.name, "\n Error Message:", err.message, "\n 进程 PID:", this.process.pid || "启动失败，无法获取进程。"]);
      this.stop();
      this.emit("error", err);
    });

    // 进程启动成功确认
    if (!this.process.pid) {
      MCSERVER.error("服务端进程启动失败，建议检查启动命令与参数是否正确，pid:", this.process.pid);
      this.stop();
      delete this.process;
      throw new Error("服务端进程启动失败，建议检查启动命令与参数是否正确");
    }

    // 输出事件的传递
    this.process.stdout.on("data", (data) => this.emit("console", iconv.decode(data, this.dataModel.oe)));
    this.process.stderr.on("data", (data) => this.emit("console", iconv.decode(data, this.dataModel.oe)));
    this.process.on("exit", (code) => {
      this.emit("exit", code);
      this.stop();
    });

    // 产生事件开启
    this.emit("open", this);

    // 输出开服信息
    this.printlnCommandLine("服务端 " + this.dataModel.name + " 执行开启命令.");
    return true;
  }

  // 发送指令
  send(command) {
    if (this._run) {
      if (this.process.dockerContainer != null) {
        this.process.stdin.write(iconv.encode(command, this.dataModel.ie) + "\n");
      } else {
        this.process.stdin.write(iconv.encode(command, this.dataModel.ie));
        this.process.stdin.write("\n");
      }
      return true;
    }
    return true;
  }

  // 重启实例
  restart() {
    if (this._run == true) {
      this.stopServer();
      // 开始计时重启
      let timeCount = 0;
      let timesCan = setInterval(() => {
        if (this._run == false) {
          // 服务器关闭时 3 秒后立即重启
          setTimeout(() => {
            try {
              this.start();
            } catch (err) {
              MCSERVER.error("服务器重启失败:", err);
            }
          }, 3000);
          clearInterval(timesCan);
        }
        //90s 内服务器依然没有关闭，代表出现问题
        if (timeCount >= 90) {
          clearInterval(timesCan);
        }
        timeCount++;
      }, 1000);

      return true;
    }
  }

  // 这并不是推荐的直接使用方式；
  // stop 方法只适用于本类调用，因为使用此方法不管是否成功停止，都必将进入停止状态；
  // 这样即有可能面板显示已经停止，但进程还在运行的情况；
  // 最好的做法是通过命令来结束。
  stop() {
    this._run = false;
    this._loading = false;
  }

  // 通过命令关闭服务器
  stopServer() {
    if (this.dataModel.stopCommand.toLocaleLowerCase() === "^c") {
      this.process.kill("SIGINT");
      return;
    }
    if (this.dataModel.stopCommand) {
      this.send(this.dataModel.stopCommand);
      return;
    }
    this.send("stop");
    this.send("end");
    this.send("exit");
  }

  // 杀死进程，若是 Docker 进程则是移除容器
  kill() {
    if (this._processType === 1) {
      this.killViaCommand();
    } else {
      this.process.kill("SIGKILL");
    }
    return true;
  }

  killViaCommand() {
    const pid = this.process.pid;
    if (!pid) {
      try {
        return this.process.kill("SIGKILL");
      } catch (err) {
        return;
      }
    }
    if (os.platform() === "win32") {
      exec(`taskkill /PID ${pid} /T /F`, (err, stdout, stderr) => {
        MCSERVER.log(`实例进程 ${pid} 使用指令强制结束 (Windows)`);
      });
    }
    if (os.platform() === "linux") {
      exec(`kill -s 9 ${pid}`, (err, stdout, stderr) => {
        MCSERVER.log(`实例进程 ${pid} 使用指令强制结束 (Linux)`);
      });
    }
    setTimeout(() => this.process.kill("SIGKILL"), 3000);
  }

  // 是否运行中
  isRun() {
    return this._run;
  }

  //输出一行到标准输出
  printlnStdin(line) {
    let str = ["[MCSMANAGER] [", tools.getFullTime(), "]:", line, "\r\n"].join(" ");
    this.emit("console", str);
  }

  printlnCommandLine(line) {
    this.emit("console", "[MCSMANAGER] -------------------------------------------------------------- \r\n");
    this.printlnStdin(line);
    this.emit("console", "[MCSMANAGER] -------------------------------------------------------------- \r\n");
  }

  isDealLineDate() {
    let timeResult = permission.isTimeLimit(this.dataModel.timeLimitDate);
    return timeResult;
  }
}

module.exports = ServerProcess;
