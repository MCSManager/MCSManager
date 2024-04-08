import { reportErrorMsg } from "@/tools/validator";
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

interface PacketProtocol<T> {
  data: T;
  status: number;
  time: number;
}

class ApiService {
  private readonly event = new EventEmitter();
  private readonly responseMap = new Map<string, ResponseDataRecord>();
  private readonly RESPONSE_CACHE_TIME = 1000 * 2;
  private readonly REQUEST_CACHE_TIME = 100;

  public async subscribe<T>(config: RequestConfig): Promise<T | undefined> {
    if (!config.url) throw new Error("ApiService: RequestConfig: 'url' is empty!");

    config = _.cloneDeep(config);
    // filter and clean up expired cache tables
    this.responseMap.forEach((value, key) => {
      if (value.timestamp + this.RESPONSE_CACHE_TIME < Date.now()) {
        this.responseMap.delete(key);
      }
    });

    if (config.forceRequest === true) {
      config.params = config?.params || {};
      config.params._force = Date.now();
      return await this.sendRequest<T>(config);
    }

    if (config.url?.startsWith("/")) {
      config.url = "." + config.url;
    }

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
            reportErrorMsg(data.message);
          }
          reject(data);
        } else {
          data = _.cloneDeep(data);
          resolve(data);
        }
      });

      if (this.responseMap.has(reqId) && !config.forceRequest) {
        const cache = this.responseMap.get(reqId) as ResponseDataRecord;
        if (cache.timestamp + this.RESPONSE_CACHE_TIME > Date.now()) {
          return this.event.emit(reqId, cache.data);
        }
      }

      if (this.event.listenerCount(reqId) <= 1 || config.forceRequest === true) {
        this.sendRequest(config, reqId);
      }
    });
  }

  private async sendRequest<T>(config: RequestConfig, reqId?: string) {
    try {
      // Force request!
      if (!reqId) {
        const { data: result } = await axios<PacketProtocol<T>>(config);
        return result?.data;
      }

      // Request cache
      const startTime = Date.now();
      if (!config.timeout) config.timeout = 1000 * 10;
      const { data: result } = await axios<PacketProtocol<T>>(config);
      const endTime = Date.now();
      const reqSpeed = endTime - startTime;
      if (reqSpeed < this.REQUEST_CACHE_TIME) await this.wait(this.REQUEST_CACHE_TIME - reqSpeed);
      const realData = result.data;
      this.responseMap.set(reqId, {
        timestamp: Date.now(),
        data: realData
      });
      this.event.emit(reqId, realData);
    } catch (error: AxiosError | Error | any) {
      const axiosErr = error as AxiosError;
      const otherErr = error as Error | any;
      if (axiosErr?.response?.data) {
        const protocol = axiosErr?.response?.data as IPanelResponseProtocol;
        if (protocol.data && protocol.status !== 200) {
          this.throwRequestError(reqId, String(protocol.data));
          return;
        }
      }
      this.throwRequestError(reqId, otherErr);
    }
  }

  private throwRequestError(reqId?: string, error?: any) {
    if (!(error instanceof Error)) error = new Error(error);

    if (reqId) {
      this.event.emit(reqId, error);
    } else {
      throw error;
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
