/* eslint-disable no-unused-vars */
import { setLanguage, getCurrentLang } from "@/lang/i18n";
import { reactive, computed } from "vue";
import { createGlobalState } from "@vueuse/core";
import logo from "@/assets/logo.png";

export enum THEME {
  LIGHT = "light",
  DARK = "dark"
}

export const THEME_KEY = "THEME_KEY";

export function getSystemTheme() {
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  return darkModeMediaQuery.matches ? THEME.DARK : THEME.LIGHT;
}

const defaultTheme = localStorage.getItem(THEME_KEY) || getSystemTheme();

export const useAppConfigStore = createGlobalState(() => {
  const appConfig = reactive({
    theme: defaultTheme as THEME,
    logoImage: logo as string
  });
  
  const logoImage = computed(() => appConfig.logoImage);

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
  
  const setLogoImage = (url: string) => {
     if (url) {
       appConfig.logoImage = url;
     }
  };

  const setBackgroundImage = (url: string) => {
    const body = document.querySelector("body");
    if (body) {
      body.style.backgroundSize = "cover";
      body.style.backgroundPosition = "center";
      body.style.backgroundRepeat = "no-repeat";
      isDarkTheme()
        ? (body.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.65) 100%), url(${url})`)
        : (body.style.backgroundImage = `linear-gradient(135deg, rgba(220,220,220,0.3), rgba(53,53,53,0.3) 100%), url(${url})`);
    }
  };

  return {
    appConfig,
    logoImage,
    setLogoImage,
    changeLanguage,
    getCurrentLanguage,
    isDarkTheme,
    setTheme,
    getTheme,
    setBackgroundImage
  };
});
