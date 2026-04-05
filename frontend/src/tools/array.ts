/* eslint-disable no-unused-vars */

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

export function arrayUnique<T>(arr: T[], felidName?: string): T[] {
  if (!felidName) return Array.from(new Set(arr));
  const map = new Map();
  return arr.filter((v: any) => !map.has(v[felidName]) && map.set(v[felidName], v));
}
