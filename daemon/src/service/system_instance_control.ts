import { $t } from "../i18n";
import schedule from "node-schedule";
import InstanceSubsystem from "./system_instance";
import StorageSubsystem from "../common/system_storage";
import logger from "./log";
import StartCommand from "../entity/commands/start";
import StopCommand from "../entity/commands/stop";
import SendCommand from "../entity/commands/cmd";
import RestartCommand from "../entity/commands/restart";
import KillCommand from "../entity/commands/kill";
import FileManager from "./system_file";

// Scheduled task configuration item interface
interface IScheduleTask {
  instanceUuid: string;
  name: string;
  count: number;
  time: string;
  action: string;
  payload: string;
  type: number;
}

// Scheduled task timer/periodic task interface
interface IScheduleJob {
  cancel: Function;
}

// @Entity
// Schedule task configuration data entity class
class TaskConfig implements IScheduleTask {
  instanceUuid = "";
  name: string = "";
  count: number = 1;
  time: string = "";
  action: string = "";
  payload: string = "";
  type: number = 1;
}

class IntervalJob implements IScheduleJob {
  public job: number = 0;

  constructor(private callback: Function, public time: number) {
    this.job = setInterval(callback, time * 1000);
  }

  cancel() {
    clearInterval(this.job);
  }
}

// Scheduled task instance class
class Task {
  constructor(public config: TaskConfig, public job?: IScheduleJob) {}
}

class InstanceControlSubsystem {
  public readonly taskMap = new Map<string, Array<Task>>();
  public readonly taskJobMap = new Map<string, schedule.Job>();

  constructor() {
    // Initialize all persistent data and load into memory one by one
    StorageSubsystem.list("TaskConfig").forEach((uuid) => {
      const config = StorageSubsystem.load("TaskConfig", TaskConfig, uuid) as TaskConfig;
      try {
        this.registerScheduleJob(config, false);
      } catch (error: any) {
        // Some scheduled tasks may be left, but the upper limit will not change
        // Ignore the scheduled task registration at startup
      }
    });
  }

  public registerScheduleJob(task: IScheduleTask, needStore = true) {
    const key = `${task.instanceUuid}`;
    if (!this.taskMap.has(key)) {
      this.taskMap.set(key, []);
    }
    const registeredTask = this.taskMap.get(key);
    if (registeredTask && registeredTask?.length >= 8)
      throw new Error($t("TXT_CODE_system_instance_control.execLimit"));
    if (!this.checkTask(key, task.name))
      throw new Error($t("TXT_CODE_system_instance_control.existRepeatTask"));
    if (!FileManager.checkFileName(task.name))
      throw new Error($t("TXT_CODE_system_instance_control.illegalName"));
    if (needStore)
      logger.info(
        $t("TXT_CODE_system_instance_control.crateTask", {
          name: task.name,
          task: JSON.stringify(task)
        })
      );

    let job: IScheduleJob;

    // min interval check
    if (task.type === 1) {
      let internalTime = Number(task.time);
      if (isNaN(internalTime) || internalTime < 1) internalTime = 1;

      // task.type=1: Time interval scheduled task, implemented with built-in timer
      job = new IntervalJob(() => {
        this.action(task);
        if (task.count === -1) return;
        if (task.count === 1) {
          job.cancel();
          this.deleteTask(key, task.name);
        } else {
          task.count--;
          this.updateTaskConfig(key, task.name, task);
        }
      }, internalTime);
    } else {
      // Expression validity check: 8 19 14 * * 1,2,3,4
      const timeArray = task.time.split(" ");
      const checkIndex = [0, 1, 2];
      checkIndex.forEach((item) => {
        if (isNaN(Number(timeArray[item])) && Number(timeArray[item]) >= 0) {
          throw new Error(
            $t("TXT_CODE_system_instance_control.crateTaskErr", {
              name: task.name,
              timeArray: timeArray
            })
          );
        }
      });
      // task.type=2: Specify time-based scheduled tasks, implemented by node-schedule library
      job = schedule.scheduleJob(task.time, () => {
        this.action(task);
        if (task.count === -1) return;
        if (task.count === 1) {
          job.cancel();
          this.deleteTask(key, task.name);
        } else {
          task.count--;
          this.updateTaskConfig(key, task.name, task);
        }
      });
    }
    const newTask = new Task(task, job);
    this.taskMap.get(key)?.push(newTask);
    if (needStore) {
      StorageSubsystem.store("TaskConfig", `${key}_${newTask.config.name}`, newTask.config);
    }
    if (needStore)
      logger.info($t("TXT_CODE_system_instance_control.crateSuccess", { name: task.name }));
  }

  public listScheduleJob(instanceUuid: string) {
    const key = `${instanceUuid}`;
    const arr = this.taskMap.get(key) || [];
    const res: IScheduleTask[] = [];
    arr.forEach((v) => {
      res.push(v.config);
    });
    return res;
  }

  public async action(task: IScheduleTask) {
    try {
      const payload = task.payload;
      const instanceUuid = task.instanceUuid;
      const instance = InstanceSubsystem.getInstance(instanceUuid);
      // If the instance has been deleted, it needs to be automatically destroyed
      if (!instance) {
        return this.deleteScheduleTask(task.instanceUuid, task.name);
      }
      const instanceStatus = instance.status();
      // logger.info(`Execute scheduled task: ${task.name} ${task.action} ${task.time} ${task.count} `);
      if (task.action === "start") {
        if (instanceStatus === 0) {
          return await instance.exec(new StartCommand("ScheduleJob"));
        }
      }
      if (task.action === "stop") {
        if (instanceStatus === 3) {
          return await instance.exec(new StopCommand());
        }
      }
      if (task.action === "restart") {
        if (instanceStatus === 3) {
          return await instance.exec(new RestartCommand());
        }
      }
      if (task.action === "command") {
        if (instanceStatus === 3) {
          return await instance.exec(new SendCommand(payload));
        }
      }
      if (task.action === "kill") {
        return await instance.exec(new KillCommand());
      }
    } catch (error: any) {
      logger.error(
        $t("TXT_CODE_system_instance_control.execCmdErr", {
          uuid: task.instanceUuid,
          name: task.name,
          error: error
        })
      );
    }
  }

  public deleteInstanceAllTask(instanceUuid: string) {
    const tasks = this.listScheduleJob(instanceUuid);
    if (tasks)
      tasks.forEach((v) => {
        this.deleteScheduleTask(instanceUuid, v.name);
      });
  }

  public deleteScheduleTask(instanceUuid: string, name: string) {
    const key = `${instanceUuid}`;
    this.deleteTask(key, name);
  }

  private deleteTask(key: string, name: string) {
    this.taskMap.get(key)?.forEach((v, index, arr) => {
      if (v?.config?.name === name) {
        v?.job?.cancel();
        arr.splice(index, 1);
      }
    });
    StorageSubsystem.delete("TaskConfig", `${key}_${name}`);
  }

  private checkTask(key: string, name: string) {
    let f = true;
    this.taskMap?.get(key)?.forEach((v, index, arr) => {
      if (v.config.name === name) f = false;
    });
    return f;
  }

  private updateTaskConfig(key: string, name: string, data: IScheduleTask) {
    const list = this.taskMap.get(key);
    for (const index in list) {
      const t = list[index as any];
      if (t.config.name === name) {
        list[index as any].config = data;
        break;
      }
    }
  }

  private checkScheduledTaskLimit(instanceUuid: string) {
    for (const iterator of this.taskMap) {
    }
  }
}

export default new InstanceControlSubsystem();
