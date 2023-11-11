import type { IPageLayoutConfig } from "../../../common/global";

export enum LayoutCardHeight {
  MINI = "100px",
  SMALL = "200px",
  MEDIUM = "400px",
  BIG = "600px",
  LARGE = "800px",
  AUTO = "unset"
}

export let ORIGIN_LAYOUT_CONFIG: IPageLayoutConfig[] = [];

export function setAllLayoutConfig(cfg: IPageLayoutConfig[]) {
  ORIGIN_LAYOUT_CONFIG = cfg;
}

export function getAllLayoutConfig() {
  return ORIGIN_LAYOUT_CONFIG;
}
