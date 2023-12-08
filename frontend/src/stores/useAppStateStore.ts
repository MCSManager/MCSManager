import { computed, reactive } from "vue";
import { createGlobalState } from "@vueuse/core";
import _ from "lodash";
import { panelStatus, userInfoApi } from "@/services/apis";
import type { LoginUserInfo } from "@/types/user";
import { initInstallPageFlow, toStandardLang } from "@/lang/i18n";

interface AppStateInfo {
  userInfo: LoginUserInfo | null;
  language: string;
  isInstall: boolean;
  versionChanged: boolean;
}

export const useAppStateStore = createGlobalState(() => {
  const { execute: reqUserInfo } = userInfoApi();

  const state: AppStateInfo = reactive<AppStateInfo>({
    userInfo: null,
    isInstall: true,
    versionChanged: false,
    language: "en_us"
  });

  const cloneState = (): AppStateInfo => {
    const tmp = _.cloneDeep(state);
    return reactive(tmp);
  };

  const isAdmin = computed(() => state.userInfo?.permission === 10);
  const isLogged = computed(() => Number(state.userInfo?.permission) > 0);

  const updateUserInfo = async (userInfo?: LoginUserInfo) => {
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
  };

  const updatePanelStatus = async () => {
    const { state } = useAppStateStore();
    const status = await panelStatus().execute();
    state.isInstall = status.value?.isInstall ?? true;
    state.versionChanged = status.value?.versionChange ? true : false;
    if (state.isInstall) {
      state.language = toStandardLang(status.value?.language);
    } else {
      state.language = toStandardLang(window.navigator.language);
      await initInstallPageFlow();
    }
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
