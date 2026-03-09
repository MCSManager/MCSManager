import { executeRequest } from "@/hooks/useApi";
import type { RequestConfig } from "@/services/apiService";

export const useDefineApi = <P, T>(baseConfig: RequestConfig = {}) => {
  return () => {
    const { isLoading, state, isReady, execute } = executeRequest<T>(baseConfig);
    return {
      isLoading,
      state,
      isReady,
      execute: async (config?: P & RequestConfig) => {
        await execute(0, config ? config : {});
        return state;
      }
    };
  };
};
