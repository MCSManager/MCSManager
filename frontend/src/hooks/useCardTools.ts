import type { LayoutCard } from "@/types";
import { useRoute } from "vue-router";

export function useLayoutCardTools(card: LayoutCard) {
  const route = useRoute();

  const setMetaValue = <T extends any>(key: string, value: T) => {
    card.meta[key] = value;
  };

  const getMetaValue = <T extends any>(key: string, def?: T): T => {
    return card.meta[key] ?? def;
  };

  const getMetaOrRouteValue = <T extends any>(key: string, def?: T) => {
    if (card.meta[key] != null) {
      return card.meta[key] as T;
    }
    if (route.query[key] != null) {
      return String(route.query[key]);
    }
    return def;
  };

  return {
    getMetaOrRouteValue,
    setMetaValue,
    getMetaValue
  };
}
