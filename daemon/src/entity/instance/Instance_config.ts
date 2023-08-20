import Instance from "./instance";
import { IDockerConfig } from "./interface";
import os from "os";
interface IActionCommand {
  name: string;
  command: string;
}

type ProcessType = "general" | "docker";

// @Entity
export default class InstanceConfig {
  public nickname = "Undefined";
  public startCommand = "";
  public stopCommand = "^C";
  public cwd = ".";
  public ie = "utf-8";
  public oe = "utf-8";
  public createDatetime = new Date().toLocaleDateString();
  public lastDatetime = "--";
  public type = Instance.TYPE_UNIVERSAL;
  public tag: string[] = [];
  public endTime: string = "";
  public fileCode: string = "utf-8";
  public processType: ProcessType = "general";
  public updateCommand: string = "";
  public crlf = os.platform() === "win32" ? 2 : 1; // 1: \n  2: \r\n

  // custom command list
  public actionCommandList: IActionCommand[] = [];

  // terminal option
  public terminalOption = {
    haveColor: false,
    pty: true,
    ptyWindowCol: 140,
    ptyWindowRow: 40
  };

  // Event task
  public eventTask = {
    autoStart: false,
    autoRestart: false,
    ignore: false
  };

  // Extend
  public docker: IDockerConfig = {
    containerName: "",
    image: "",
    ports: [],
    extraVolumes: [],
    memory: null,
    networkMode: "bridge",
    networkAliases: [],
    cpusetCpus: "",
    cpuUsage: null,
    maxSpace: null,
    io: null,
    network: null
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
