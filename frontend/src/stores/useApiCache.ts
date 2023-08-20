import { executeRequest } from "@/hooks/useApi";
import type { AxiosRequestConfig } from "axios";

export interface RequestConfig extends AxiosRequestConfig {
  forceRequest?: boolean;
}

export const useDefineApi = <P, T>(baseConfig: RequestConfig = {}) => {
  return () => {
    const { isLoading, state, isReady, execute } = executeRequest<T>(baseConfig);
    return {
      isLoading,
      state,
      isReady,
      execute: async (config: P & RequestConfig) => {
        await execute(0, config);
        return state;
      },
    };
  };
};
