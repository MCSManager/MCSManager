/* eslint-disable no-unused-vars */
import { setLanguage, getCurrentLang } from "@/lang/i18n";
import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";

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

  const setBackgroundImage = (url: string) => {
    const body = document.querySelector("body");
    if (body) {
      body.style.backgroundSize = "cover";
      body.style.backgroundPosition = "center";
      body.style.backgroundRepeat = "no-repeat";
      isDarkTheme()
        ? (body.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3) 100%), url(${url})`)
        : (body.style.backgroundImage = `linear-gradient(135deg, rgba(220,220,220,0.3), rgba(53,53,53,0.3) 100%), url(${url})`);
    }
  };

  return {
    appConfig,
    changeLanguage,
    getCurrentLanguage,
    isDarkTheme,
    setTheme,
    getTheme,
    setBackgroundImage
  };
});
