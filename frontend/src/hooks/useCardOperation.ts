import { LayoutCardHeight } from "@/config/originLayoutConfig";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";

export function useCardOperation() {
  const { deleteLayoutItem, getCardById } = useLayoutConfigStore();

  const deleteCard = (id: string) => {
    deleteLayoutItem("", id);
  };

  const LEVEL_LIST = [
    LayoutCardHeight.LARGE,
    LayoutCardHeight.BIG,
    LayoutCardHeight.MEDIUM,
    LayoutCardHeight.SMALL,
    LayoutCardHeight.MINI
  ];

  const addCardHeight = (id: string) => {
    const card = getCardById("", id);
    const newIndex = LEVEL_LIST.findIndex((item) => item === card?.height);
    if (newIndex >= 0 && LEVEL_LIST[newIndex - 1] && card) {
      card.height = LEVEL_LIST[newIndex - 1];
    }
  };

  const reduceCardHeight = (id: string) => {
    const card = getCardById("", id);
    const newIndex = LEVEL_LIST.findIndex((item) => item === card?.height);
    if (newIndex >= 0 && LEVEL_LIST[newIndex + 1] && card) {
      card.height = LEVEL_LIST[newIndex + 1];
    }
  };

  const addCardWidth = (id: string) => {
    const card = getCardById("", id);
    if (card && card.width < 12) card.width += 1;
  };

  const reduceCardWidth = (id: string) => {
    const card = getCardById("", id);
    if (card && card.width > 1) card.width -= 1;
  };

  const editCardName = (id: string, newName: string) => {
    const card = getCardById("", id);
    if (card) card.title = newName;
  };

  return {
    deleteCard,
    addCardWidth,
    reduceCardWidth,
    reduceCardHeight,
    addCardHeight,
    editCardName
  };
}
