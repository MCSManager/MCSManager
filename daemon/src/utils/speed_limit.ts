import { IncomingMessage } from "http";
import { Transform, TransformCallback } from "stream";

type OnCallback = (chunk: any) => void;

/**
 * 基于令牌桶的 Transform，限制上游数据的传输速率（bytes/sec）。
 * 通过不调用 callback 来维持背压，避免大块数据在 JS 层无限堆积。
 */
class ThrottleTransform extends Transform {
  private readonly bytesPerSecond: number;
  private tokens: number = 0;
  private readonly refillIntervalMs: number;
  private refillTimer?: NodeJS.Timeout;

  private pendingBuffer: Buffer | null = null;
  private pendingCb?: TransformCallback;

  constructor(bytesPerSecond: number, refillIntervalMs = 100) {
    super();
    this.bytesPerSecond = Math.max(0, Math.floor(bytesPerSecond || 0));
    this.refillIntervalMs = refillIntervalMs;

    if (this.bytesPerSecond > 0) {
      this.refillTimer = setInterval(() => {
        // 令牌补充，最多允许一个 1 秒配额的突发
        const refill = (this.bytesPerSecond * this.refillIntervalMs) / 1000;
        this.tokens = Math.min(this.bytesPerSecond, this.tokens + refill);
        this.tryDrain();
      }, this.refillIntervalMs);
      // 避免进程被定时器保持常驻
      this.refillTimer.unref?.();
    }
  }

  _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
    if (this.bytesPerSecond <= 0) {
      // 不限速：直接透传
      this.push(chunk);
      callback();
      return;
    }

    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    this.pendingBuffer = buf;
    this.pendingCb = callback;
    this.tryDrain();
  }

  private tryDrain() {
    if (this.bytesPerSecond <= 0) return;
    if (!this.pendingBuffer) return;

    while (this.tokens > 0 && this.pendingBuffer && this.pendingBuffer.length > 0) {
      const grant = Math.min(this.tokens, this.pendingBuffer.length);
      const part = this.pendingBuffer.subarray(0, grant);
      this.tokens -= grant;
      this.push(part);

      if (grant === this.pendingBuffer.length) {
        // 本块已完全消费，释放背压
        this.pendingBuffer = null;
        const cb = this.pendingCb;
        this.pendingCb = undefined;
        cb && cb();
        return;
      } else {
        // 仅发出部分，等待下一次令牌补充
        this.pendingBuffer = this.pendingBuffer.subarray(grant);
        break;
      }
    }
  }

  _flush(callback: TransformCallback) {
    if (this.refillTimer) clearInterval(this.refillTimer);
    callback();
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void) {
    if (this.refillTimer) clearInterval(this.refillTimer);
    callback(error);
  }
}

// 通过 Proxy 代理 IncomingMessage 对象，只代理部分方法和属性，其他保持原始行为
// 要求实现上传限速功能（bytes/sec），并尽可能利用 Node 背压避免内存堆积
export function proxyIncomingMessage(target: IncomingMessage, rate: number) {
  let throttled: ThrottleTransform | null = null;

  const ensureThrottled = () => {
    if (!rate || rate <= 0) return null;
    if (!throttled) {
      throttled = new ThrottleTransform(rate);
      target.pipe(throttled);
      // 错误和关闭交给管道传播
    }
    return throttled;
  };

  const proxy = new Proxy(target as any, {
    get(_t, property: string, _receiver) {
      if (property === "on" || property === "addListener" || property === "once") {
        return function (eventName: string, listener: (...args: any[]) => void) {
          // 对数据相关事件使用节流后的流，其余维持原始行为
          if (eventName === "data" || eventName === "readable") {
            const t = ensureThrottled();
            if (t) {
              (t as any)[property](eventName, listener);
              return proxy;
            }
          }
          if (
            (eventName === "end" || eventName === "close" || eventName === "error") &&
            throttled
          ) {
            (throttled as any)[property](eventName, listener);
            return proxy;
          }
          (target as any)[property](eventName, listener);
          return proxy;
        };
      }

      if (property === "pipe") {
        return function (destination: any, options?: any) {
          const t = ensureThrottled();
          if (t) return t.pipe(destination, options);
          return (target as any).pipe(destination, options);
        };
      }

      if (property === "unpipe") {
        return function (destination?: any) {
          if (throttled) {
            (throttled as any).unpipe(destination);
            return proxy;
          }
          (target as any).unpipe(destination);
          return proxy;
        };
      }

      // 其他方法/属性保持原始行为
      const value = (target as any)[property];
      if (typeof value === "function") return value.bind(target);
      return value;
    },

    set(t: any, property: string, value: any) {
      t[property] = value;
      return true;
    }
  });

  return proxy as IncomingMessage;
}
