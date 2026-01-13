import logger from "./log";

type TaskFn<T> = () => Promise<T>;

interface QueueTask<T> {
  label: string;
  fn: TaskFn<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * A tiny concurrency-limited queue shared by disk checks, downloads, and file operations.
 * Ensures at most `concurrency` tasks run in parallel to avoid IO storms.
 */
export class TaskQueue {
  private static instance: TaskQueue;
  private readonly concurrency: number;
  private running = 0;
  private readonly queue: QueueTask<any>[] = [];

  private constructor(concurrency: number) {
    this.concurrency = Math.max(1, concurrency);
  }

  public static getInstance(concurrency = 3): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue(concurrency);
    }
    return TaskQueue.instance;
  }

  public enqueue<T>(label: string, fn: TaskFn<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ label, fn, resolve, reject });
      this.drain();
    });
  }

  private drain() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) return;
      this.running++;
      task
        .fn()
        .then(task.resolve)
        .catch((err) => {
          logger.warn(
            `Task queue job failed (${task.label}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          task.reject(err);
        })
        .finally(() => {
          this.running--;
          this.drain();
        });
    }
  }
}

export const globalTaskQueue = TaskQueue.getInstance();
