export interface TagInfo {
  label: string;
  value: string | number;
  icon?: any;
  color?: "error" | "default" | "success" | "processing" | "warning";
  onClick?: () => void;
}
