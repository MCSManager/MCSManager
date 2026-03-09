import { createGlobalState } from "@vueuse/core";
import { reactive } from "vue";

export const useLayoutContainerStore = createGlobalState(() => {
  const containerState = reactive({
    isDesignMode: false,
    showNewCardDialog: false,
    showPhoneMenu: false
  });

  const changeDesignMode = (b: boolean) => {
    containerState.isDesignMode = b;
  };

  return {
    containerState,
    changeDesignMode
  };
});
