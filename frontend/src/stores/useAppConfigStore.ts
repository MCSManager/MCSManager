/* eslint-disable no-unused-vars */
import logo from "@/assets/logo.png";
import { useScreen } from "@/hooks/useScreen";
import { getCurrentLang, setLanguage } from "@/lang/i18n";
import { AppTheme, THEME_KEY } from "@/types/const";
import { createGlobalState, useBreakpoints, useLocalStorage, usePreferredDark } from "@vueuse/core";
import { theme as antTheme } from "ant-design-vue";
import type { ThemeConfig } from "ant-design-vue/es/config-provider/context";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useLayoutConfigStore } from "./useLayoutConfig";

export const useAppConfigStore = createGlobalState(() => {
  const isPreferredDark = usePreferredDark();
  const { getSettingsConfig } = useLayoutConfigStore();

  const theme: ThemeConfig = reactive({
    algorithm: antTheme.defaultAlgorithm,
    token: {
      fontSizeLG: 14,
      fontSizeSM: 12,
      fontSizeXL: 18
    }
  });
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

  const { isPhone } = useScreen();
  const backgrounds = reactive({ backgroundImage: "", pBgUrl: "" });
  const backgroundImage = computed(() =>
    isPhone.value ? backgrounds.pBgUrl || backgrounds.backgroundImage : backgrounds.backgroundImage
  );
  const hasBgImage = computed(() => Boolean(backgroundImage.value));

  /** Main app nav layout: "left" = sidebar, "right" = top header only. Filled by initAppTheme(). */
  const sidebarPosition = ref<"left" | "right">("left");

  /** Whether to show the left sidebar; when false, only top header (AppHeader) is used. */
  const breakpoints = useBreakpoints({ sidebar: 1400 });
  const isWideEnoughForSidebar = breakpoints.greaterOrEqual("sidebar");
  const useSidebarLayout = computed(
    () => sidebarPosition.value === "left" && isWideEnoughForSidebar.value
  );

  const setBackgroundImage = (
    url: string,
    target: "backgroundImage" | "pBgUrl" = "backgroundImage"
  ) => {
    backgrounds[target] = url;
  };

  watch(
    [backgroundImage, isDarkTheme],
    ([url]) => {
      const body = document.querySelector("body");
      if (body) {
        if (!url) {
          body.style.removeProperty("background-image");
          body.style.removeProperty("background-size");
          body.style.removeProperty("background-position");
          body.style.removeProperty("background-repeat");
          body.classList.remove("app-light-extend-theme", "app-dark-extend-theme");
          return;
        }
        body.style.backgroundSize = "cover";
        body.style.backgroundPosition = "center";
        body.style.backgroundRepeat = "no-repeat";
        if (isDarkTheme.value) {
          body.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.65), rgba(0,0,0,0.65) 100%), url(${JSON.stringify(
            url
          )})`;
          body.classList.remove("app-light-extend-theme");
          body.classList.add("app-dark-extend-theme");
        } else {
          body.style.backgroundImage = `linear-gradient(135deg, rgba(220,220,220,0.3), rgba(53,53,53,0.3) 100%), url(${JSON.stringify(
            url
          )})`;
          body.classList.remove("app-dark-extend-theme");
          body.classList.add("app-light-extend-theme");
        }
      }
    },
    { immediate: true }
  );

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

  const applyTheme = () => {
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
  };

  const initAppTheme = async () => {
    applyTheme();
    const frontendSettings = await getSettingsConfig();
    backgrounds.backgroundImage = frontendSettings?.theme?.backgroundImage ?? "";
    backgrounds.pBgUrl = frontendSettings?.theme?.pBgUrl ?? "";
    const pos = frontendSettings?.theme?.sidebarPosition;
    sidebarPosition.value = pos === "left" || pos === "right" ? pos : "right";
  };

  const setTheme = (t: AppTheme) => {
    currentTheme.value = t;
    applyTheme();
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
      applyTheme();
    }
  });

  onMounted(async () => {
    try {
      const settingsConfig = await getSettingsConfig();
      if (settingsConfig?.theme?.logoImage) {
        setLogoImage(settingsConfig.theme.logoImage);
      }
    } catch (error) {
      console.error("Failed to load settings config:", error);
    }
  });

  return {
    appConfig,
    logoImage,
    hasBgImage,
    sidebarPosition,
    useSidebarLayout,
    setLogoImage,
    changeLanguage,
    getCurrentLanguage,
    isDarkTheme,
    initAppTheme,
    setTheme,
    setBackgroundImage,
    currentTheme,
    themeConfig: theme
  };
});
