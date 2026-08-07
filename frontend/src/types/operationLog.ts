export type GlobalGeneralOptions = {
  operation_id: string;
  operation_time: string;
  operation_level: "info" | "warning" | "error";
  operator_ip: string;
  operator_name?: string;
  operator_source?: "api";
};

export type InstanceGeneralOptions = {
  instance_id: string;
  daemon_id: string;
  instance_name?: string;
  daemon_name?: string;
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
  config_before?: any;
  config_after?: any;
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
  // Deletion is always a batch operation
  file: string | string[];
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
  daemon_name?: string;
} & GlobalGeneralOptions;

export type DaemonRemoveOptions = {
  type: "daemon_remove";
  daemon_id: string;
  daemon_name?: string;
} & GlobalGeneralOptions;

export type DaemonConfigChangeOptions = {
  type: "daemon_config_change";
  daemon_id: string;
  daemon_name?: string;
  config_before?: any;
  config_after?: any;
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
  target_user_name?: string;
  password_reset?: boolean;
  config_before?: any;
  config_after?: any;
} & GlobalGeneralOptions;

export type UserLoginOptions = {
  type: "user_login";
  login_result: boolean;
  login_method?: string;
} & GlobalGeneralOptions;

export type SsoUnbindOptions = {
  type: "sso_unbind";
  target_user_name: string;
} & GlobalGeneralOptions;

export type SystemConfigChangeOptions = {
  type: "system_config_change";
  config_before?: any;
  config_after?: any;
} & GlobalGeneralOptions;

export type InstanceFileDownloadFromUrlOptions = {
  type: "instance_file_download_from_url";
  url: string;
  file: string;
} & InstanceGeneralOptions;

export type InstanceFileRenameOptions = {
  type: "instance_file_rename";
  file_before: string;
  file_after: string;
} & InstanceGeneralOptions;

export type InstanceFileMoveOptions = {
  type: "instance_file_move";
  file_before: string;
  file_after: string;
} & InstanceGeneralOptions;

export type InstanceFileCompressOptions = {
  type: "instance_file_compress";
  file: string;
  targets?: string[];
} & InstanceGeneralOptions;

export type InstanceFileDecompressOptions = {
  type: "instance_file_decompress";
  file: string;
  target_dir?: string;
} & InstanceGeneralOptions;

export type UserApiKeyChangeOptions = {
  type: "user_apikey_change";
  target_user_name: string;
  enabled: boolean;
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
  | InstanceFileDownloadFromUrlOptions
  | InstanceFileUploadOptions
  | InstanceFileUpdateOptions
  | InstanceFileDownloadOptions
  | InstanceFileDeleteOptions
  | InstanceFileRenameOptions
  | InstanceFileMoveOptions
  | InstanceFileCompressOptions
  | InstanceFileDecompressOptions
  | InstanceTaskCreateOptions
  | InstanceTaskDeleteOptions
  | DaemonCreateOptions
  | DaemonRemoveOptions
  | DaemonConfigChangeOptions
  | UserCreateOptions
  | UserDeleteOptions
  | UserConfigChangeOptions
  | UserApiKeyChangeOptions
  | UserLoginOptions
  | SsoUnbindOptions
  | SystemConfigChangeOptions;

export type OperationLoggerType = OperationLoggerItem["type"];

export interface OperationLogQueryResult {
  page: number;
  pageSize: number;
  maxPage: number;
  total: number;
  data: OperationLoggerItem[];
}
