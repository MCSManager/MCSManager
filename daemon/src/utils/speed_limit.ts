import { createReadStream, promises as fsPromises } from "fs";
import { IncomingMessage } from "http";
import { ParameterizedContext } from "koa";
import send from "koa-send";
import path from "path";
import { Transform, TransformCallback } from "stream";
import { globalConfiguration } from "../entity/config";

/**
 * Maintains backpressure by slowly calling callbacks to prevent large chunks of data
 * from accumulating infinitely in the JS layer.
 */
export class ThrottleTransform extends Transform {
  private resolve: (() => void) | null = null;
  private consumerTasks: NodeJS.Timeout;

  constructor(rate: number) {
    super();
    if (rate >= 1000 || rate <= 0 || isNaN(rate)) rate = 1000;
    this.consumerTasks = setInterval(() => {
      this.resolve?.();
      this.resolve = null;
    }, 1000 / rate);
  }

  private pending(): Promise<void> {
    if (this.resolve) {
      throw new Error("ThrottleTransform is already pending, cannot call pending() again.");
    }
    return new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
  }

  async _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): Promise<void> {
    await this.pending();
    this.push(chunk);
    callback();
  }

  _flush(callback: TransformCallback): void {
    clearInterval(this.consumerTasks);
    this.resolve = null;
    callback();
  }

  _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    clearInterval(this.consumerTasks);
    this.resolve = null;
    callback(error);
  }
}

// Proxy the IncomingMessage object, only proxy specific methods and properties, keep other behaviors original
export function proxyIncomingMessage(incomingMessage: IncomingMessage, rate: number) {
  let throttled: ThrottleTransform | null = null;

  const ensureThrottled = () => {
    if (!rate || rate <= 0) return null;
    if (!throttled) {
      throttled = new ThrottleTransform(rate);
      incomingMessage.pipe(throttled);
    }
    return throttled;
  };

  const proxy = new Proxy(incomingMessage, {
    get(target, property: string) {
      if (property === "on" || property === "addListener" || property === "once") {
        return function (eventName: string, listener: (...args: any[]) => void) {
          if (["end", "close", "error", "data", "readable"].includes(eventName)) {
            const stream = ensureThrottled();
            if (stream) {
              stream[property](eventName, listener);
              return proxy;
            }
          }
          target[property](eventName, listener);
          return proxy;
        };
      }

      if (property === "pipe") {
        return function (destination: any, options?: any) {
          const stream = ensureThrottled();
          if (stream) return stream.pipe(destination, options);
          return target.pipe(destination, options);
        };
      }

      if (property === "unpipe") {
        return function (destination?: any) {
          const stream = ensureThrottled();
          if (stream) return stream.unpipe(destination);
          return target.unpipe(destination);
        };
      }

      // @ts-ignore
      const value = target[property];
      if (typeof value === "function") return value.bind(target);
      return value;
    },

    set(t: any, property: string, value: any) {
      t[property] = value;
      return true;
    }
  });

  return proxy;
}

export async function sendFile(ctx: ParameterizedContext, fileAbsPath: string) {
  const rate = Number(globalConfiguration.config.downloadSpeedRate) || 0;
  if (rate <= 0) {
    const fileDir = path.dirname(fileAbsPath);
    const fileName = path.basename(fileAbsPath);
    ctx.set("Content-Type", "application/octet-stream");
    await send(ctx, fileName, { root: fileDir + "/", hidden: true });
    return;
  }

  const fileName = path.basename(fileAbsPath);
  const stats = await fsPromises.stat(fileAbsPath);

  ctx.set("Content-Type", "application/octet-stream");
  ctx.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  ctx.set("Content-Length", stats.size.toString());

  const fileStream = createReadStream(fileAbsPath);
  ctx.body = fileStream.pipe(new ThrottleTransform(rate));
}
