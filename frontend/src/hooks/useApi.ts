import { apiService, type RequestConfig } from "@/services/apiService";
import { useAsyncState } from "@vueuse/core";
import _ from "lodash";

export function executeRequest<T>(config: RequestConfig) {
  if (!config) throw new Error("AxiosRequestConfig is undefined!");

  return useAsyncState<T | undefined, RequestConfig[]>(
    async (moreConfig: RequestConfig = {}) => {
      config = _.cloneDeep(Object.assign({}, config, moreConfig));
      return await apiService.subscribe<T>(config);
    },
    undefined,
    {
      immediate: false,
      shallow: false as any,
      throwError: true,
      resetOnExecute: false
    }
  );
}
