import EventEmitter from "events";
import logger from "../log";
export interface IAsyncTaskJSON {
  [key: string]: any;
}

export interface IAsyncTask extends EventEmitter {
  // The taskId must be complex enough to prevent other users from accessing the information
  taskId: string;
  type: string;
  start(): Promise<boolean | void>;
  stop(): Promise<boolean | void>;
  status(): number;
  toObject(): IAsyncTaskJSON;
}

export abstract class AsyncTask extends EventEmitter implements IAsyncTask {
  constructor() {
    super();
  }

  public taskId: string = "";
  public type: string = "";

  // 0=stop 1=running -1=error
  protected _status = 0;

  public start() {
    this._status = 1;
    const r = this.onStarted();
    this.emit("started");
    return r;
  }

  public stop() {
    if (this._status !== -1) this._status = 0;
    const r = this.onStopped();
    this.emit("stopped");
    return r;
  }

  public error(err: Error) {
    this._status = -1;
    logger.error(`AsyncTask - ID: ${this.taskId} TYPE: ${this.type} Error:`, err);
    this.onError(err);
    this.emit("error", err);

    this.stop();
  }

  status(): number {
    return this._status;
  }

  public abstract onStarted(): Promise<boolean | void>;
  public abstract onStopped(): Promise<boolean | void>;
  public abstract onError(err: Error): void;
  public abstract toObject(): IAsyncTaskJSON;
}

export class TaskCenter {
  public static tasks = new Array<IAsyncTask>();

  public static addTask(t: IAsyncTask) {
    TaskCenter.tasks.push(t);
    t.start();
    t.on("stopped", () => TaskCenter.onTaskStopped(t));
    t.on("error", () => TaskCenter.onTaskError(t));
  }

  public static onTaskStopped(t: IAsyncTask) {
    logger.info("Async Task:", t.taskId, "Stopped.");
  }

  public static onTaskError(t: IAsyncTask) {
    logger.info("Async Task:", t.taskId, "Failed.");
  }

  public static getTask(taskId: string, type?: string) {
    for (const iterator of TaskCenter.tasks) {
      if (iterator.taskId === taskId && (type == null || iterator.type === type)) return iterator;
    }
  }

  public static getTasks(type?: string) {
    const result: IAsyncTask[] = [];
    for (const iterator of TaskCenter.tasks) {
      if (type == null || iterator.type === type) {
        result.push(iterator);
      }
    }
    return result;
  }

  public static deleteAllStoppedTask() {
    TaskCenter.tasks.forEach((v, i, arr) => {
      if (v.status() !== 1) {
        arr.splice(i, 1);
      }
    });
  }
}
