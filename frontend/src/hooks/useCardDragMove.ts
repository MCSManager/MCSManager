import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { findParentWithClass } from "@/tools/dom";

export function useCardDragMove() {
  const { deleteLayoutItem, insertLayoutItem, getIndexById } =
    useLayoutConfigStore();

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

  const moveCardItem = (
    sourceId: string,
    targetId: string,
    newArea = false
  ) => {
    if (sourceId === targetId) return;
    if (sourceId) {
      const checkIndex = getIndexById("", sourceId);
      let newIndex = getIndexById("", targetId);
      if (checkIndex != -1) {
        // 从布局池中移动
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dragover = (e: DragEvent, id: string) => {
    e.preventDefault();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dragenter = (e: DragEvent, id: string) => {
    addDragClass(e.currentTarget as HTMLElement);
    e.preventDefault();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dragleave = (e: DragEvent, id: string) => {
    if (
      !(e.currentTarget as HTMLElement)?.contains(
        e.relatedTarget as HTMLLIElement
      )
    ) {
      removeDragClass(e.target as HTMLElement);
    }
    e.preventDefault();
  };

  const dragstart = (e: DragEvent, id: string) => {
    e?.dataTransfer?.setData("text/plain", JSON.stringify({ id })); // 设置拖动数据
  };

  const drop = (e: DragEvent, myId: string) => {
    e.preventDefault();
    removeDragClass(e.target as HTMLElement);
    const sourceConfig = JSON.parse(
      e?.dataTransfer?.getData("text/plain") || "{}"
    );
    const sourceId = sourceConfig?.id;
    moveCardItem(sourceId, myId);
  };

  const dropToNewArea = (e: DragEvent, followId: string) => {
    e.preventDefault();
    removeDragClass(
      e.target as HTMLElement,
      "global-placeholder-card",
      "global-placeholder-card-dragover"
    );
    const sourceConfig = JSON.parse(
      e?.dataTransfer?.getData("text/plain") || "{}"
    );
    const sourceId = sourceConfig?.id;
    console.log("拖动到新区域", e, sourceId, "--->", followId);
    moveCardItem(sourceId, followId, true);
  };

  const newAreaDragenter = (e: DragEvent) => {
    addDragClass(
      e.currentTarget as HTMLElement,
      "global-placeholder-card",
      "global-placeholder-card-dragover"
    );
    e.preventDefault();
  };

  const newAreaDragleave = (e: DragEvent) => {
    if (
      !(e.currentTarget as HTMLElement)?.contains(
        e.relatedTarget as HTMLLIElement
      )
    ) {
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
    newAreaDragleave,
  };
}
