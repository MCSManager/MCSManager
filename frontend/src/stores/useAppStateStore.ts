import { computed, reactive } from "vue";
import { createGlobalState } from "@vueuse/core";
import _ from "lodash";
import { panelStatus, userInfoApi } from "@/services/apis";
import type { LoginUserInfo } from "@/types/user";
import { initInstallPageFlow, searchSupportLanguage, toStandardLang } from "@/lang/i18n";
import type { PanelStatus } from "@/types";

interface AppStateInfo extends PanelStatus {
  userInfo: LoginUserInfo | null;
}

export const useAppStateStore = createGlobalState(() => {
  const { execute: reqUserInfo } = userInfoApi();

  const state: AppStateInfo = reactive<AppStateInfo>({
    userInfo: null,
    isInstall: true,
    versionChange: false,
    language: "en_us",
    settings: {
      canFileManager: false,
      allowUsePreset: false
    }
  });

  const cloneState = (): AppStateInfo => {
    const tmp = _.cloneDeep(state);
    return reactive(tmp);
  };

  const isAdmin = computed(() => state.userInfo?.permission === 10);
  const isLogged = computed(() => Number(state.userInfo?.permission) > 0);

  const updateUserInfo = async (userInfo?: LoginUserInfo) => {
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
  };

  const updatePanelStatus = async () => {
    const { state } = useAppStateStore();
    const status = await panelStatus().execute();
    state.isInstall = status.value?.isInstall ?? true;
    state.versionChange = status.value?.versionChange ? true : false;
    state.settings = status.value?.settings ?? {
      canFileManager: false,
      allowUsePreset: false
    };
    if (state.isInstall) {
      state.language = toStandardLang(status.value?.language);
    } else {
      state.language = searchSupportLanguage(window.navigator.language);
      await initInstallPageFlow(state.language);
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
    state
  };
});
