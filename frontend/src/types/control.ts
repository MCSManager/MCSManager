import type { INSTANCE_STATUS_CODE } from "./const";

export type ControlTargetMode = "instance" | "global";

export interface ControlTarget {
  daemonId: string;
  mode: ControlTargetMode;
  instanceId: string;
  displayName: string;
  daemonDisplayName: string;
  daemonAvailable: boolean;
  status?: INSTANCE_STATUS_CODE;
  description?: string;
  instanceType?: string;
}

export interface ControlLogLine {
  id: string;
  time: string;
  level: "info" | "warn" | "error" | "command";
  text: string;
}

export type ControlDashboardMetricTone = "default" | "success" | "warning" | "danger" | "muted";

export interface ControlDashboardMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: ControlDashboardMetricTone;
}

export interface ControlDashboardMetaItem {
  key: string;
  label: string;
  value: string;
}

export interface ControlPreviewNode {
  daemonId: string;
  daemonDisplayName: string;
  daemonAvailable: boolean;
  description: string;
  endpoint: string;
  targets: ControlTarget[];
}
