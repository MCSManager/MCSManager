import { LANGUAGE_KEY, setLanguage, getCurrentLang } from "@/lang/i18n";
import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";
import { useLayoutConfigStore } from "./useLayoutConfig";

export enum THEME {
  LIGHT = "light",
  DARK = "dark"
}

export const THEME_KEY = "THEME_KEY";

const defaultTheme = localStorage.getItem(THEME_KEY) || THEME.LIGHT;

export const useAppConfigStore = createGlobalState(() => {
  // const { hasBgImage } = useLayoutConfigStore();

  const appConfig = reactive({
    theme: defaultTheme as THEME
  });

  const setTheme = (theme: THEME) => {
    appConfig.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    window.location.reload();
  };

  const isDarkTheme = () => {
    return appConfig.theme === THEME.DARK;
  };

  const getTheme = () => {
    return appConfig.theme as THEME;
  };

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
  };

  const getCurrentLanguage = () => {
    return getCurrentLang() ?? "en_us";
  };

  return {
    appConfig,
    changeLanguage,
    getCurrentLanguage,
    isDarkTheme,
    setTheme,
    getTheme
  };
});
