import type { LayoutCard } from "@/types";

export function useLayoutCardTools(card: LayoutCard) {
  const setMetaValue = <T extends any>(key: string, value: T) => {
    card.meta[key] = value;
  };

  const getMetaValue = <T extends any>(key: string, def?: T): T => {
    return card.meta[key] ?? def;
  };

  return {
    setMetaValue,
    getMetaValue,
  };
}
