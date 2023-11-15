import path from "path";
import fs from "fs-extra";
import Instance from "../instance/instance";
import InstanceCommand from "./base/command";
import RefreshPlayer from "./task/players";
import MinecraftGetPlayersCommand from "../minecraft/mc_getplayer";
import NullCommand from "./nullfunc";
import GeneralStartCommand from "./general/general_start";
import GeneralStopCommand from "./general/general_stop";
import GeneralKillCommand from "./general/general_kill";
import GeneralSendCommand from "./general/general_command";
import GeneralRestartCommand from "./general/general_restart";
import DockerStartCommand from "./docker/docker_start";
import TimeCheck from "./task/time";
import MinecraftBedrockGetPlayersCommand from "../minecraft/mc_getplayer_bedrock";
import GeneralUpdateCommand from "./general/general_update";
import PtyStartCommand from "./pty/pty_start";
import PtyStopCommand from "./pty/pty_stop";
import { PTY_PATH } from "../../const";
import OpenFrpTask from "./task/openfrp";

// instance function scheduler
// Dispatch and assign different functions according to different types
export default class FunctionDispatcher extends InstanceCommand {
  constructor() {
    super("FunctionDispatcher");
  }

  async exec(instance: Instance) {
    // initialize all modules
    instance.lifeCycleTaskManager.clearLifeCycleTask();
    instance.clearPreset();

    // the component that the instance must mount
    instance.lifeCycleTaskManager.registerLifeCycleTask(new TimeCheck());
    instance.lifeCycleTaskManager.registerLifeCycleTask(new OpenFrpTask());

    // Instance general preset capabilities
    instance.setPreset("command", new GeneralSendCommand());
    instance.setPreset("stop", new GeneralStopCommand());
    instance.setPreset("kill", new GeneralKillCommand());
    instance.setPreset("restart", new GeneralRestartCommand());
    instance.setPreset("update", new GeneralUpdateCommand());

    // Preset the basic operation mode according to the instance startup type
    if (!instance.config.processType || instance.config.processType === "general") {
      instance.setPreset("start", new GeneralStartCommand());
    }

    // Enable emulated terminal mode
    if (
      instance.config.terminalOption.pty &&
      instance.config.terminalOption.ptyWindowCol &&
      instance.config.terminalOption.ptyWindowRow &&
      instance.config.processType === "general"
    ) {
      instance.setPreset("start", new PtyStartCommand());
      instance.setPreset("stop", new PtyStopCommand());
      instance.setPreset("resize", new NullCommand());
    }
    // Whether to enable Docker PTY mode
    if (instance.config.processType === "docker") {
      instance.setPreset("resize", new NullCommand());
      instance.setPreset("start", new DockerStartCommand());
    }

    // Set different preset functions and functions according to different types
    if (instance.config.type.includes(Instance.TYPE_UNIVERSAL)) {
      instance.setPreset("getPlayer", new NullCommand());
    }
    if (instance.config.type.includes(Instance.TYPE_MINECRAFT_JAVA)) {
      instance.setPreset("getPlayer", new MinecraftGetPlayersCommand());
      instance.lifeCycleTaskManager.registerLifeCycleTask(new RefreshPlayer());
    }
    if (instance.config.type.includes(Instance.TYPE_MINECRAFT_BEDROCK)) {
      instance.setPreset("getPlayer", new MinecraftBedrockGetPlayersCommand());
      instance.lifeCycleTaskManager.registerLifeCycleTask(new RefreshPlayer());
    }
  }
}
