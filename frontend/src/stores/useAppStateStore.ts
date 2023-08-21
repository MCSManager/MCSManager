import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";
import _ from "lodash";

export const useAppStateStore = createGlobalState(() => {
  const state = reactive<{
    userInfo: BaseUserInfo | null;
  }>({
    userInfo: null
  });

  const cloneState = () => {
    if (!state) return null;
    const tmp = _.cloneDeep(state);
    return reactive(tmp);
  };

  return {
    cloneState,
    state
  };
});
