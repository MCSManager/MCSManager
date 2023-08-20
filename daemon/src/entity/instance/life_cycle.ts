import Instance from "./instance";

export interface ILifeCycleTask {
  name: string; // task name
  status: number; // Running status, the default is 0, the task manager will automatically change
  start: (instance: Instance) => Promise<void>;
  stop: (instance: Instance) => Promise<void>;
}

export class LifeCycleTaskManager {
  // list of life cycle tasks
  public readonly lifeCycleTask: ILifeCycleTask[] = [];

  constructor(private self: any) {}

  registerLifeCycleTask(task: ILifeCycleTask) {
    this.lifeCycleTask.push(task);
  }

  execLifeCycleTask(type: number) {
    if (type == 1) {
      this.lifeCycleTask.forEach((v) => {
        if (v.status === 0) v.start(this.self);
        v.status = 1;
      });
    } else {
      this.lifeCycleTask.forEach((v) => {
        if (v.status === 1) v.stop(this.self);
        v.status = 0;
      });
    }
  }

  clearLifeCycleTask() {
    this.execLifeCycleTask(0);
    this.lifeCycleTask.splice(0, this.lifeCycleTask.length);
  }
}
