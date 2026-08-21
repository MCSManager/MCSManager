import { LANGUAGE_KEY, toStandardLang } from "@/lang/i18n";
import { panelStatus, userInfoApi } from "@/services/apis";
import type { PanelStatus } from "@/types";
import type { LoginUserInfo } from "@/types/user";
import { createGlobalState, useLocalStorage } from "@vueuse/core";
import _ from "lodash";
import { computed, reactive, ref } from "vue";

interface AppStateInfo extends PanelStatus {
  userInfo: LoginUserInfo | null;
}

export const useAppStateStore = createGlobalState(() => {
  const { execute: reqUserInfo } = userInfoApi();

  const language = useLocalStorage(LANGUAGE_KEY, toStandardLang(window.navigator.language));
  const state: AppStateInfo = reactive<AppStateInfo>({
    userInfo: null,
    isInstall: true,
    language: language.value,
    settings: {
      panelId: "",
      canFileManager: false,
      allowUsePreset: false,
      businessMode: false,
      businessId: "",
      allowChangeCmd: false,
      ssoEnabled: false
    }
  });

  const generatedApiKey = ref<string | undefined>();

  const cloneState = (): AppStateInfo => {
    const tmp = _.cloneDeep(state);
    return reactive(tmp);
  };

  const isAdmin = computed(() => state.userInfo?.permission === 10);
  const isLogged = computed(() => Number(state.userInfo?.permission) > 0);

  const updateUserInfo = async (userInfo?: LoginUserInfo) => {
    const wasLogged = isLogged.value;
    try {
      if (userInfo) {
        state.userInfo = userInfo;
      } else {
        const info = await reqUserInfo();
        if (info.value) {
          state.userInfo = info.value;
        } else {
          throw new Error("Failed to get user information from server!");
        }
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }

    if (isLogged.value != wasLogged) {
      try {
        await updatePanelStatus();
      } catch (err) {
        console.error("Failed to refresh panel status after login:", err);
      }
    }
  };

  const updatePanelStatus = async () => {
    const { state } = useAppStateStore();
    const panelStatusRes = await panelStatus().execute();
    state.isInstall = panelStatusRes.value?.isInstall ?? true;
    if (panelStatusRes.value?.settings) {
      state.settings = { ...state.settings, ...panelStatusRes.value.settings };
    }
    if (state.isInstall) {
      state.language = language.value = toStandardLang(panelStatusRes.value?.language);
    }
    console.info("Window.navigator.language:", window.navigator.language);
    console.info("Panel Language:", state.language);
  };

  return {
    cloneState,
    updateUserInfo,
    updatePanelStatus,
    isAdmin,
    isLogged,
    generatedApiKey,
    state
  };
});
