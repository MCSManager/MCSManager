import os from "os";
import Instance from "./instance";

interface IActionCommand {
  name: string;
  command: string;
}

// @Entity
export default class InstanceConfig implements IGlobalInstanceConfig {
  public nickname = "Undefined";
  public startCommand = "";
  public stopCommand = "^C";
  public cwd = ".";
  public ie = "utf-8";
  public oe = "utf-8";
  public createDatetime = Date.now();
  public lastDatetime = Date.now();
  public type = Instance.TYPE_UNIVERSAL;
  public tag: string[] = [];
  public endTime: number = 0;
  public fileCode: string = "utf-8";
  public processType: ProcessType = "general";
  public updateCommand: string = "";
  public runAs: string = "";
  public crlf = os.platform() === "win32" ? 2 : 1; // 1: \n  2: \r\n
  public category = 0;
  public basePort = 0;

  // Steam RCON protocol
  public enableRcon = false;
  public rconPassword = "";
  public rconPort = 0;
  public rconIp = "";

  // custom command list
  public actionCommandList: IActionCommand[] = [];

  // terminal option
  public terminalOption = {
    haveColor: false,
    pty: true,
    ptyWindowCol: 164,
    ptyWindowRow: 40
  };

  // Event task
  public eventTask = {
    autoStart: false,
    autoRestart: false,
    autoRestartMaxTimes: -1,
    ignore: false
  };

  // java
  public java: IInstanceJavaConfig = {
    id: ""
  };

  // Extend
  public docker: IGlobalInstanceDockerConfig = {
    containerName: "",
    image: "",
    ports: [],
    extraVolumes: [],
    capAdd: [],
    capDrop: [],
    devices: [],
    privileged: false,
    memory: 0,
    memorySwap: undefined,
    memorySwappiness: undefined,
    networkMode: "bridge",
    networkAliases: [],
    cpusetCpus: "",
    cpuUsage: 0,
    maxSpace: 0,
    io: 0,
    network: 0,
    workingDir: "/workspace/",
    env: [],
    changeWorkdir: true,
    labels: []
  };

  public pingConfig = {
    ip: "",
    port: 25565,
    type: 1
  };

  public extraServiceConfig = {
    openFrpTunnelId: "",
    openFrpToken: ""
  };
}
