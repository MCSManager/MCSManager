import { createGlobalState } from "@vueuse/core";
import { reactive } from "vue";

export const useLayoutContainerStore = createGlobalState(() => {
  const containerState = reactive({
    isDesignMode: false,
    showNewCardDialog: false,
    showPhoneMenu: false,
    instanceAppearance: {
      color: ""
    }
  });

  const changeDesignMode = (b: boolean) => {
    containerState.isDesignMode = b;
  };

  const setInstanceAppearance = (color = "") => {
    containerState.instanceAppearance.color = color;
  };

  return {
    containerState,
    changeDesignMode,
    setInstanceAppearance
  };
});
