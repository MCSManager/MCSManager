import { LANGUAGE_KEY, setLanguage } from "@/lang/i18n";
import { createGlobalState } from "@vueuse/core";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";

export enum THEME {
  LIGHT = "light",
  DARK = "dark",
}

export const THEME_KEY = "THEME_KEY";

const defaultTheme = localStorage.getItem(THEME_KEY) || THEME.LIGHT;

export const useAppToolsStore = createGlobalState(() => {
  const state = reactive({
    inputDialog: {
      title: "",
      show: false,
      resolve: (value: unknown) => {},
      reject: (value: unknown) => {},
    },
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
    openInputDialog,
  };
});
