import EventEmitter from "events";
import logger from "../log";

export type IAsyncTaskJSON = any;

export interface IAsyncTask extends EventEmitter {
  // The taskId must be complex enough to prevent other users from accessing the information
  taskId: string;
  type: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): number;
  toObject(): IAsyncTaskJSON;
}

export abstract class AsyncTask extends EventEmitter implements IAsyncTask {
  public static readonly STATUS_STOP = 0;
  public static readonly STATUS_RUNNING = 1;
  public static readonly STATUS_ERROR = -1;

  public taskId: string = "";
  public type: string = "";

  public errorInfo?: Error;

  protected _status = AsyncTask.STATUS_STOP;

  constructor() {
    super();
  }

  public async start() {
    this._status = AsyncTask.STATUS_RUNNING;
    try {
      await this.onStart();
      this.emit("started");
    } catch (error: any) {
      this.error(error);
      throw error;
    }
  }

  public async stop() {
    if (this._status === AsyncTask.STATUS_STOP) return Promise.resolve();
    try {
      await this.onStop();
    } finally {
      if (this._status !== AsyncTask.STATUS_ERROR) this._status = AsyncTask.STATUS_STOP;
      this.emit("stopped");
    }
  }

  public async error(err: Error) {
    this._status = AsyncTask.STATUS_ERROR;
    this.errorInfo = err;
    logger.error(`AsyncTask - ID: ${this.taskId} TYPE: ${this.type} Error:`, err);
    await this.onError(err);
    this.emit("error", err);
    this.stop();
  }

  public wait() {
    return new Promise<void>((resolve, reject) => {
      if (this._status === AsyncTask.STATUS_STOP) {
        return resolve();
      }
      if (this._status === AsyncTask.STATUS_ERROR) {
        return reject(this.errorInfo);
      }
      this.once("stopped", () => {
        resolve();
      });
      this.once("error", (err) => {
        reject(err);
      });
    });
  }

  status(): number {
    return this._status;
  }

  public abstract onStart(): Promise<void>;
  public abstract onStop(): Promise<void>;
  public abstract onError(err: Error): Promise<void>;
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
