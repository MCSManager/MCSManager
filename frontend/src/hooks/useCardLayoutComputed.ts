import { LayoutCardHeight } from "@/config/originLayoutConfig";
import { getRandomId } from "@/tools/randId";
import type { LayoutCard } from "@/types";
import { computed } from "vue";

export const PLACE_HOLDER_CARD = "PLACEHOLDER";
export const DEFAULT_PLACE_HOLDER_CARD = {
  id: "",
  type: PLACE_HOLDER_CARD,
  title: "",
  width: 0,
  height: LayoutCardHeight.SMALL
};

export function useCardLayoutComputed(currentLayoutConfig: LayoutCard[]) {
  const computedLayout = computed(() => {
    const newLayoutConfig: LayoutCard[] = [];
    let currentColNumber = 0;

    function lastLineCheck(currentLineWidth: number, i: number) {
      if (currentLineWidth != 12 && currentLineWidth != 0 && i + 1 == currentLayoutConfig.length) {
        newLayoutConfig.push({
          ...DEFAULT_PLACE_HOLDER_CARD,
          id: getRandomId(),
          width: 12 - currentLineWidth,
          followId: currentLayoutConfig[currentLayoutConfig.length - 1].id,
          meta: {}
        });
      }
    }

    for (let i = 0; i < currentLayoutConfig.length; i++) {
      const config = currentLayoutConfig[i];
      if (currentColNumber + config.width == 12 || currentColNumber == 12) {
        newLayoutConfig.push(config);
        currentColNumber = currentColNumber === 12 ? config.width : 12;
        lastLineCheck(currentColNumber, i);
        continue;
      }
      if (currentColNumber + config.width > 12) {
        // i - 1 must be greater than 0 because there is already an element in front of it
        const lastID = currentLayoutConfig[i - 1].id;
        newLayoutConfig.push({
          ...DEFAULT_PLACE_HOLDER_CARD,
          id: getRandomId(),
          width: 12 - currentColNumber,
          followId: lastID,
          meta: {}
        });
        newLayoutConfig.push(config);
        currentColNumber = config.width;
      } else {
        newLayoutConfig.push(config);
        currentColNumber += config.width;
      }
      lastLineCheck(currentColNumber, i);
    }

    return newLayoutConfig;
  });

  return { computedLayout };
}
