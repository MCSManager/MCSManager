import Instance from "./instance";
import os from "os";
import { IGlobalInstanceConfig, IGlobalInstanceDockerConfig } from "common/global";
interface IActionCommand {
  name: string;
  command: string;
}

type ProcessType = "general" | "docker";

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
  public crlf = os.platform() === "win32" ? 2 : 1; // 1: \n  2: \r\n

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
    ignore: false
  };

  // Extend
  public docker: IGlobalInstanceDockerConfig = {
    containerName: "",
    image: "",
    ports: [],
    extraVolumes: [],
    memory: 0,
    networkMode: "bridge",
    networkAliases: [],
    cpusetCpus: "",
    cpuUsage: 0,
    maxSpace: 0,
    io: 0,
    network: 0,
    workingDir: "/workspace/",
    env: []
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
