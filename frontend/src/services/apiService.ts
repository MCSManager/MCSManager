import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import EventEmitter from "events";
import _ from "lodash";

export interface RequestConfig extends AxiosRequestConfig {
  forceRequest?: boolean;
}

class ApiService {
  private readonly event = new EventEmitter();

  public async subscribe<T>(config: RequestConfig): Promise<T | undefined> {
    const reqId = btoa(
      [
        String(config.method),
        String(config.url),
        JSON.stringify(config.data ?? {}),
        JSON.stringify(config.params ?? {}),
      ].join(""),
    );

    return new Promise((resolve, reject) => {
      this.event.once(reqId, (data: any) => {
        if (data instanceof Error) {
          reject(data);
        } else {
          data = _.cloneDeep(data);
          resolve(data);
        }
      });

      if (this.event.listenerCount(reqId) <= 1 || config.forceRequest) {
        this.sendRequest(reqId, config);
      }
    });
  }

  private async sendRequest(reqId: string, config: AxiosRequestConfig) {
    try {
      const startTime = Date.now();
      const result = await axios(config);
      const endTime = Date.now();
      const reqSpeed = endTime - startTime;
      if (reqSpeed < 100) await this.wait(100 - reqSpeed);
      this.event.emit(reqId, result.data);
    } catch (error) {
      this.event.emit(reqId, error);
    }
  }

  private wait(time: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, time);
    });
  }
}

export const apiService = new ApiService();
