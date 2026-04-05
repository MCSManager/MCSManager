import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { findParentWithClass } from "@/tools/dom";

export function useCardDragMove() {
  const { deleteLayoutItem, insertLayoutItem, getIndexById } = useLayoutConfigStore();
  const { containerState } = useLayoutContainerStore();
  const addDragClass = (
    dom: HTMLElement,
    targetClassName = "layout-card-container",
    actionClassName = "global-layout-card-dragover"
  ) => {
    if (!dom) return;
    const div = findParentWithClass(dom, targetClassName);
    if (div) div.classList.add(actionClassName);
  };
  const removeDragClass = (
    dom: HTMLElement,
    targetClassName = "layout-card-container",
    actionClassName = "global-layout-card-dragover"
  ) => {
    if (!dom) return;
    const div = findParentWithClass(dom, targetClassName);
    if (div) div.classList.remove(actionClassName);
  };

  const moveCardItem = (sourceId: string, targetId: string, newArea = false) => {
    if (sourceId === targetId) return;
    if (sourceId) {
      const checkIndex = getIndexById("", sourceId);
      let newIndex = getIndexById("", targetId);
      if (checkIndex != -1) {
        // Move from layout pool
        const item = deleteLayoutItem("", sourceId);
        if (!item) return;
        if (!newArea) {
          insertLayoutItem("", item, newIndex);
        } else {
          if (checkIndex > newIndex) newIndex += 1;
          insertLayoutItem("", item, newIndex);
        }
      }
    }
  };

  const dragover = (e: DragEvent, id: string) => {
    if (!containerState.isDesignMode) return;
    e.preventDefault();
  };

  const dragenter = (e: DragEvent, id: string) => {
    if (!containerState.isDesignMode) return;
    addDragClass(e.currentTarget as HTMLElement);
    e.preventDefault();
  };

  const dragleave = (e: DragEvent, id: string) => {
    if (!containerState.isDesignMode) return;
    if (!(e.currentTarget as HTMLElement)?.contains(e.relatedTarget as HTMLLIElement)) {
      removeDragClass(e.target as HTMLElement);
    }
    e.preventDefault();
  };

  const dragstart = (e: DragEvent, id: string) => {
    if (!containerState.isDesignMode) return;
    e?.dataTransfer?.setData("text/plain", JSON.stringify({ id })); // Set drag data
  };

  const drop = (e: DragEvent, myId: string) => {
    if (!containerState.isDesignMode) return;
    e.preventDefault();
    removeDragClass(e.target as HTMLElement);
    const sourceConfig = JSON.parse(e?.dataTransfer?.getData("text/plain") || "{}");
    const sourceId = sourceConfig?.id;
    moveCardItem(sourceId, myId);
  };

  const dropToNewArea = (e: DragEvent, followId: string) => {
    if (!containerState.isDesignMode) return;
    e.preventDefault();
    removeDragClass(
      e.target as HTMLElement,
      "global-placeholder-card",
      "global-placeholder-card-dragover"
    );
    const sourceConfig = JSON.parse(e?.dataTransfer?.getData("text/plain") || "{}");
    const sourceId = sourceConfig?.id;
    moveCardItem(sourceId, followId, true);
  };

  const newAreaDragenter = (e: DragEvent) => {
    if (!containerState.isDesignMode) return;
    addDragClass(
      e.currentTarget as HTMLElement,
      "global-placeholder-card",
      "global-placeholder-card-dragover"
    );
    e.preventDefault();
  };

  const newAreaDragleave = (e: DragEvent) => {
    if (!(e.currentTarget as HTMLElement)?.contains(e.relatedTarget as HTMLLIElement)) {
      removeDragClass(
        e.target as HTMLElement,
        "global-placeholder-card",
        "global-placeholder-card-dragover"
      );
    }
    e.preventDefault();
  };

  return {
    dragleave,
    dragover,
    drop,
    dragstart,
    dragenter,
    dropToNewArea,
    newAreaDragenter,
    newAreaDragleave
  };
}
