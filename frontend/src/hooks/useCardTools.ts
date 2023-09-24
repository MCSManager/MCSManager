import { t } from "@/lang/i18n";
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

  const getMetaOrRouteValue = (key: string, require = true): string | undefined => {
    if (card.meta[key] != null) {
      return card.meta[key];
    }
    if (route.query[key] != null) {
      return String(route.query[key]);
    }

    if (require)
      throw new Error(
        [t("卡片所需参数"), `"${key}"`, t("不存在于 URL 地址或初始化设定中。")].join(" ")
      );
    return undefined;
  };

  return {
    getMetaOrRouteValue,
    setMetaValue,
    getMetaValue
  };
}
