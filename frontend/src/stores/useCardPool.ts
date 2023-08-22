import { getLayoutCardPool } from "@/config";
import { createGlobalState } from "@vueuse/core";

export const useCardPool = createGlobalState(() => {
  const getCardPool = () => {
    return getLayoutCardPool();
  };

  return {
    getCardPool
  };
});
