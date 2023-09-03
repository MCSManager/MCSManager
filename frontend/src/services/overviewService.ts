import { createGlobalState } from "@vueuse/core";
import { overviewInfo } from "./apis";

export const useAppToolsStore = createGlobalState(() => {
  const { execute, state } = overviewInfo();

  return {
    overviewData: state
  };
});
