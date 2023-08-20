import { defineStore } from "pinia";
import { reactive } from "vue";
import type { LayoutWithRouter, LayoutCard } from "@/types";
import { useRouterParams } from "@/hooks/useRouterParams";
import { ORIGIN_LAYOUT_CONFIG } from "@/config/originLayoutConfig";
import { createGlobalState } from "@vueuse/core";

export const useLayoutConfigStore = createGlobalState(() => {
  const { currentRoutePath } = useRouterParams();

  const globalLayoutConfig = reactive<LayoutWithRouter[]>(ORIGIN_LAYOUT_CONFIG);

  const getPageLayoutConfig = (pageName: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const res = globalLayoutConfig.find((item) => item.page === pageName)
      ?.items;
    return res ? res : [];
  };

  const deleteLayoutItem = (pageName: string, id: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    let index = 0;
    for (const iterator of items) {
      if (iterator?.id === id) {
        return items.splice(index, 1)?.[0];
      }
      index++;
    }
    return null;
  };

  const insertLayoutItem = (
    pageName: string,
    card: LayoutCard,
    index?: number
  ) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    if (items) {
      if (index != null) {
        items.splice(index, 0, card);
      } else {
        items.push(card);
      }
    }
  };

  const moveCardItem = (
    pageName: string,
    sourceId: string,
    targetId: string
  ) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    const sourceIndex = getIndexById(pageName, sourceId);
    const targetIndex = getIndexById(pageName, targetId);
    items.splice(targetIndex, 0, items.splice(sourceIndex, 1)[0]);
  };

  const getIndexById = (pageName: string, id: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    return items.findIndex((item) => item.id === id);
  };

  const getCardById = (pageName: string, id: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    return items.find((item) => item.id === id);
  };

  return {
    getPageLayoutConfig,
    deleteLayoutItem,
    insertLayoutItem,
    getIndexById,
    getCardById,
    moveCardItem,
    globalLayoutConfig,
  };
});
