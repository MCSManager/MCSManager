import Instance from "../instance/instance";
import InstanceCommand from "./base/command";
import DockerResizeCommand from "./docker/docker_pty_resize";
import DockerStartCommand from "./docker/docker_start";
import GeneralSendCommand from "./general/general_command";
import GeneralInstallCommand from "./general/general_install";
import GeneralKillCommand from "./general/general_kill";
import GeneralRestartCommand from "./general/general_restart";
import GeneralStartCommand from "./general/general_start";
import GeneralStopCommand from "./general/general_stop";
import GeneralUpdateCommand from "./general/general_update";
import PingJavaMinecraftServerCommand from "./minecraft/mc_ping";
import NullCommand from "./nullfunc";
import PtyResizeCommand from "./pty/pty_resize";
import PtyStartCommand from "./pty/pty_start";
import RconCommand from "./steam/rcon_command";
import InstanceDiskCheckTask from "./task/any_stats";
import DockerStatsTask from "./task/docker_stats";
import PingMinecraftServerTask from "./task/mc_players";
import TimeCheck from "./task/time";

// If you add a new "Preset", Please add the definition here.
export type IPresetCommand =
  | "start"
  | "stop"
  | "restart"
  | "kill"
  | "update"
  | "refreshPlayers"
  | "command"
  | "resize"
  | "install";

// Instance function dispatcher
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

    // Instance general preset capabilities
    instance.setPreset("command", new GeneralSendCommand());
    instance.setPreset("stop", new GeneralStopCommand());
    instance.setPreset("kill", new GeneralKillCommand());
    instance.setPreset("restart", new GeneralRestartCommand());
    instance.setPreset("update", new GeneralUpdateCommand());
    instance.setPreset("refreshPlayers", new NullCommand());
    instance.setPreset("install", new GeneralInstallCommand());
    instance.lifeCycleTaskManager.registerLifeCycleTask(new InstanceDiskCheckTask());

    // Preset the basic operation mode according to the instance startup type
    if (!instance.config.processType || instance.config.processType === "general") {
      instance.setPreset("start", new GeneralStartCommand());
    }

    // Enable emulated terminal mode
    if (instance.config.terminalOption.pty && instance.config.processType === "general") {
      instance.setPreset("start", new PtyStartCommand());
      instance.setPreset("resize", new PtyResizeCommand());
    }
    // Whether to enable Docker PTY mode
    if (instance.config.processType === "docker") {
      instance.setPreset("start", new DockerStartCommand());
      instance.setPreset("resize", new DockerResizeCommand());
      instance.lifeCycleTaskManager.registerLifeCycleTask(new DockerStatsTask());
    }
    if (instance.config.enableRcon) {
      instance.setPreset("command", new RconCommand());
    }

    // Minecraft Ping
    if (instance.config.type.includes(Instance.TYPE_MINECRAFT_JAVA)) {
      instance.setPreset("refreshPlayers", new PingJavaMinecraftServerCommand());
      instance.lifeCycleTaskManager.registerLifeCycleTask(new PingMinecraftServerTask());
    }
  }
}
