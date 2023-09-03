import { message } from "ant-design-vue";
import type { IPanelResponseProtocol } from "./../../../common/global.d";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { AxiosError, AxiosRequestConfig } from "axios";
import axios from "axios";
import EventEmitter from "events";
import _ from "lodash";

axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.interceptors.request.use(async (config) => {
  const { state } = useAppStateStore();
  if (!config.params) config.params = {};
  config.params.token = state.userInfo?.token;
  return config;
});

export interface RequestConfig extends AxiosRequestConfig {
  forceRequest?: boolean;
  errorAlert?: boolean;
}
interface ResponseDataRecord {
  timestamp: number;
  data: any;
}

class ApiService {
  private readonly event = new EventEmitter();
  private readonly responseMap = new Map<string, ResponseDataRecord>();
  private readonly RESPONSE_CACHE_TIME = 1000 * 2;
  private readonly REQUEST_CACHE_TIME = 100;

  public async subscribe<T>(config: RequestConfig): Promise<T | undefined> {
    // filter and clean up expired cache tables
    this.responseMap.forEach((value, key) => {
      if (value.timestamp + this.RESPONSE_CACHE_TIME < Date.now()) {
        this.responseMap.delete(key);
      }
    });

    const reqId = encodeURIComponent(
      [
        String(config.method),
        String(config.url),
        JSON.stringify(config.data ?? {}),
        JSON.stringify(config.params ?? {})
      ].join("")
    );

    return new Promise((resolve, reject) => {
      this.event.once(reqId, (data: any) => {
        if (data instanceof Error) {
          if (config.errorAlert === true) {
            message.error(data.message);
          }
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

  private async sendRequest(reqId: string, config: RequestConfig) {
    try {
      const startTime = Date.now();

      if (this.responseMap.has(reqId) && !config.forceRequest) {
        const cache = this.responseMap.get(reqId) as ResponseDataRecord;
        if (cache.timestamp + this.RESPONSE_CACHE_TIME > Date.now()) {
          console.debug("[ApiService] Cache hit: ", config);
          return this.event.emit(reqId, cache.data);
        }
      }

      console.debug(`[ApiService] Request: ${config.url} \n Full AxiosRequestConfig:`, config);
      if (!config.timeout) config.timeout = 1000 * 10;
      const result = await axios(config);
      const endTime = Date.now();
      const reqSpeed = endTime - startTime;
      if (reqSpeed < this.REQUEST_CACHE_TIME) await this.wait(this.REQUEST_CACHE_TIME - reqSpeed);
      let realData = result.data;
      if (realData.data) realData = realData.data;

      this.responseMap.set(reqId, {
        timestamp: Date.now(),
        data: realData
      });

      console.debug("请求响应缓存表长度：", this.responseMap.size);

      this.event.emit(reqId, realData);
    } catch (error: AxiosError | Error | any) {
      const axiosErr = error as AxiosError;
      const otherErr = error as Error | any;
      if (axiosErr?.response?.data) {
        const protocol = axiosErr?.response?.data as IPanelResponseProtocol;
        if (protocol.data && protocol.status !== 200) {
          this.event.emit(reqId, new Error(String(protocol.data)));
          return;
        }
      }
      if (otherErr instanceof Error) {
        this.event.emit(reqId, otherErr);
      } else {
        this.event.emit(reqId, new Error(String(otherErr)));
      }
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
