import { createGlobalState } from "@vueuse/core";
import { reactive } from "vue";

export enum THEME {
  LIGHT = "light",
  DARK = "dark"
}

export const THEME_KEY = "THEME_KEY";

export const useAppToolsStore = createGlobalState(() => {
  const state = reactive({
    inputDialog: {
      title: "",
      show: false,
      resolve: (value: unknown) => {},
      reject: (value: unknown) => {}
    }
  });

  const openInputDialog = (title: string) => {
    state.inputDialog.title = title;
    state.inputDialog.show = true;
    return new Promise((resolve, reject) => {
      state.inputDialog.resolve = resolve;
      state.inputDialog.reject = reject;
    });
  };

  return {
    state,
    openInputDialog
  };
});
