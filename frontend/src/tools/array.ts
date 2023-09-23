import type { JsonData } from "@/types";

export interface ConditionFilterItem {
  condition?: (index?: number) => boolean;
}

export function arrayFilter<T>(arr: (T & ConditionFilterItem)[]): T[] {
  return arr.filter((item, index) => {
    if (typeof item.condition === "function") {
      return item.condition(index);
    } else {
      return true;
    }
  });
}
