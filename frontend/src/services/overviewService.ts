import { createGlobalState } from "@vueuse/core";
import { overviewInfo } from "./apis";

export const useAppToolsStore = createGlobalState(() => {
  const { state } = overviewInfo();

  return {
    overviewData: state
  };
});
