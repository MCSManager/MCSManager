/* eslint-disable no-unused-vars */
import logo from "@/assets/logo.png";
import { getCurrentLang, setLanguage } from "@/lang/i18n";
import { AppTheme, THEME_KEY } from "@/types/const";
import { createGlobalState, useLocalStorage, usePreferredDark } from "@vueuse/core";
import { theme as antTheme } from "ant-design-vue";
import type { ThemeConfig } from "ant-design-vue/es/config-provider/context";
import { computed, reactive, ref, watch } from "vue";
import { useLayoutConfigStore } from "./useLayoutConfig";

const isPreferredDark = usePreferredDark();
const { getSettingsConfig } = useLayoutConfigStore();

export const theme: ThemeConfig = reactive({
  algorithm: antTheme.defaultAlgorithm,
  token: {
    fontSizeLG: 14,
    fontSizeSM: 12,
    fontSizeXL: 18
  }
});

export const useAppConfigStore = createGlobalState(() => {
  const appConfig = reactive({
    logoImage: logo as string
  });

  const logoImage = computed(() => appConfig.logoImage);

  const currentTheme = useLocalStorage<AppTheme>(THEME_KEY, AppTheme.LIGHT);

  const isDarkTheme = computed(() => {
    if (currentTheme.value === AppTheme.DARK) return true;
    if (currentTheme.value === AppTheme.AUTO) return isPreferredDark.value;
    return false;
  });

  const hasBgImage = ref(false);
  const setBackgroundImage = (url: string) => {
    const body = document.querySelector("body");
    if (body) {
      body.style.backgroundSize = "cover";
      body.style.backgroundPosition = "center";
      body.style.backgroundRepeat = "no-repeat";
      if (isDarkTheme.value) {
        body.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.65) 100%), url(${url})`;
        body.classList.remove("app-light-extend-theme");
        body.classList.add("app-dark-extend-theme");
      } else {
        body.style.backgroundImage = `linear-gradient(135deg, rgba(220,220,220,0.3), rgba(53,53,53,0.3) 100%), url(${url})`;
        body.classList.remove("app-dark-extend-theme");
        body.classList.add("app-light-extend-theme");
      }

      hasBgImage.value = true;
    }
  };

  const setLight = () => {
    theme.algorithm = antTheme.defaultAlgorithm;
    document.body.classList.add("app-light-theme");
    document.body.classList.remove("app-dark-theme");
  };

  const setDark = () => {
    theme.algorithm = antTheme.darkAlgorithm;
    document.body.classList.add("app-dark-theme");
    document.body.classList.remove("app-light-theme");
  };

  const resetTheme = () => (currentTheme.value = AppTheme.LIGHT);

  const initAppTheme = async () => {
    if (
      isNaN(currentTheme.value) ||
      currentTheme.value < AppTheme.AUTO ||
      currentTheme.value > AppTheme.DARK
    ) {
      resetTheme();
    }
    const fn = {
      [AppTheme.AUTO]: () => (isPreferredDark.value ? setDark() : setLight()),
      [AppTheme.LIGHT]: () => setLight(),
      [AppTheme.DARK]: () => setDark()
    };
    fn[currentTheme.value]?.();

    const frontendSettings = await getSettingsConfig();
    if (frontendSettings?.theme?.backgroundImage)
      setBackgroundImage(frontendSettings.theme.backgroundImage);
  };

  const setTheme = (t: AppTheme) => {
    currentTheme.value = t;
    initAppTheme();
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

  watch(isPreferredDark, () => {
    if (currentTheme.value === AppTheme.AUTO) {
      initAppTheme();
    }
  });

  return {
    appConfig,
    logoImage,
    hasBgImage,
    setLogoImage,
    changeLanguage,
    getCurrentLanguage,
    isDarkTheme,
    initAppTheme,
    setTheme,
    setBackgroundImage,
    currentTheme
  };
});
