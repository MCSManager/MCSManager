import type { JsonData } from "@/types";

export interface ConditionFilterItem extends JsonData {
  condition?: (index?: number) => boolean;
}

export function arrayFilter<T extends ConditionFilterItem>(arr: T[]) {
  return arr.filter((item, index) => {
    if (typeof item.condition === "function") {
      return item.condition(index);
    } else {
      return true;
    }
  });
}
