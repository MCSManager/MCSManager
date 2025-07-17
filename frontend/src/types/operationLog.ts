export type GlobalGeneralOptions = {
  operation_id: string;
  operation_time: string;
  operation_level: "info" | "warning" | "error";
  operator_ip: string;
  operator_name?: string;
};

export type InstanceGeneralOptions = {
  instance_id: string;
  daemon_id: string;
  instance_name?: string;
} & GlobalGeneralOptions;

export type InstanceStartOptions = {
  type: "instance_start";
} & InstanceGeneralOptions;

export type InstanceStopOptions = {
  type: "instance_stop";
} & InstanceGeneralOptions;

export type InstanceRestartOptions = {
  type: "instance_restart";
} & InstanceGeneralOptions;

export type InstanceUpdateOptions = {
  type: "instance_update";
} & InstanceGeneralOptions;

export type InstanceKillOptions = {
  type: "instance_kill";
} & InstanceGeneralOptions;

export type InstanceConfigChangeOptions = {
  type: "instance_config_change";
} & InstanceGeneralOptions;

export type InstanceCreateOptions = {
  type: "instance_create";
} & InstanceGeneralOptions;

export type InstanceDeleteOptions = {
  type: "instance_delete";
} & InstanceGeneralOptions;

export type InstanceFileUploadOptions = {
  type: "instance_file_upload";
  file?: string;
} & InstanceGeneralOptions;

export type InstanceFileUpdateOptions = {
  type: "instance_file_update";
  file: string;
} & InstanceGeneralOptions;

export type InstanceFileDownloadOptions = {
  type: "instance_file_download";
  file: string;
} & InstanceGeneralOptions;

export type InstanceFileDeleteOptions = {
  type: "instance_file_delete";
  file: string;
} & InstanceGeneralOptions;

export type InstanceTaskCreateOptions = {
  type: "instance_task_create";
  task_name: string;
} & InstanceGeneralOptions;

export type InstanceTaskDeleteOptions = {
  type: "instance_task_delete";
  task_name: string;
} & InstanceGeneralOptions;

export type DaemonCreateOptions = {
  type: "daemon_create";
  daemon_id: string;
} & GlobalGeneralOptions;

export type DaemonRemoveOptions = {
  type: "daemon_remove";
  daemon_id: string;
} & GlobalGeneralOptions;

export type DaemonConfigChangeOptions = {
  type: "daemon_config_change";
  daemon_id: string;
} & GlobalGeneralOptions;

export type UserCreateOptions = {
  type: "user_create";
  target_user_name: string;
} & GlobalGeneralOptions;

export type UserDeleteOptions = {
  type: "user_delete";
  target_user_name: string;
} & GlobalGeneralOptions;

export type UserConfigChangeOptions = {
  type: "user_config_change";
} & GlobalGeneralOptions;

export type SystemConfigChangeOptions = {
  type: "system_config_change";
} & GlobalGeneralOptions;

export type OperationLoggerItem =
  | InstanceStartOptions
  | InstanceStopOptions
  | InstanceRestartOptions
  | InstanceUpdateOptions
  | InstanceKillOptions
  | InstanceConfigChangeOptions
  | InstanceCreateOptions
  | InstanceDeleteOptions
  | InstanceFileUploadOptions
  | InstanceFileUpdateOptions
  | InstanceFileDownloadOptions
  | InstanceFileDeleteOptions
  | InstanceTaskCreateOptions
  | InstanceTaskDeleteOptions
  | DaemonCreateOptions
  | DaemonRemoveOptions
  | DaemonConfigChangeOptions
  | UserCreateOptions
  | UserDeleteOptions
  | UserConfigChangeOptions
  | SystemConfigChangeOptions;
