import type { LiteralUnion } from "ant-design-vue/es/_util/type";
import type { PresetColorType } from "ant-design-vue/es/theme/internal";

export interface TagInfo {
  label: string;
  value: string | number;
  icon?: any;
  color?: "error" | "default" | "success" | "processing" | "warning";
}
