import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";
import _ from "lodash";

interface AppStateInfo {
  userInfo: BaseUserInfo | null;
}

export const useAppStateStore = createGlobalState(() => {
  const state: AppStateInfo = reactive<AppStateInfo>({
    userInfo: null
  });

  const cloneState = (): AppStateInfo => {
    const tmp = _.cloneDeep(state);
    return reactive(tmp);
  };

  return {
    cloneState,
    state
  };
});
