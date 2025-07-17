import { ref } from "vue";
import { getOperationLog } from "@/services/apis/operationLog";
import { t } from "@/lang/i18n";
import type { OperationLoggerItem } from "@/types/operationLog";

type LogsDataItem = OperationLoggerItem & { text: string };
type LogsData = { color: string; item: LogsDataItem[] };
type TextRenderResult = {
  text: string;
  data: string[];
};

type OperationRenderer = {
  [K in OperationLoggerItem["type"]]: (
    // This variable is actually used internally. Fix the plugin's false positive error.
    // eslint-disable-next-line no-unused-vars
    item: Extract<OperationLoggerItem, { type: K }>
  ) => TextRenderResult;
};

const renderMap: OperationRenderer = {
  instance_start: (item) => ({
    text: t("用户 {{operator_name}} 启动了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_stop: (item) => ({
    text: t("用户 {{operator_name}} 关闭了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_restart: (item) => ({
    text: t("用户 {{operator_name}} 重启了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_update: (item) => ({
    text: t("用户 {{operator_name}} 更新了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_kill: (item) => ({
    text: t("用户 {{operator_name}} 强制终止了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_config_change: (item) => ({
    text: t("用户 {{operator_name}} 修改了 {{instance_name}} 实例配置"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_create: (item) => ({
    text: t("用户 {{operator_name}} 创建了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_delete: (item) => ({
    text: t("用户 {{operator_name}} 删除了 {{instance_name}} 实例"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_file_upload: (item) => ({
    text: t("用户 {{operator_name}} 向 {{instance_name}} 实例上传了文件 {{file}}"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_file_update: (item) => ({
    text: t("用户 {{operator_name}} 更新了 {{instance_name}} 实例的文件 {{file}}"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_file_download: (item) => ({
    text: t("用户 {{operator_name}} 下载了 {{instance_name}} 实例的文件 {{file}}"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_file_delete: (item) => ({
    text: t("用户 {{operator_name}} 删除了 {{instance_name}} 实例的文件 {{file}}"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_task_create: (item) => ({
    text: t("用户 {{operator_name}} 为 {{instance_name}} 实例创建了任务 {{task_name}}"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.task_name
    ]
  }),
  instance_task_delete: (item) => ({
    text: t("用户 {{operator_name}} 删除了 {{instance_name}} 实例的任务 {{task_name}}"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.task_name
    ]
  }),
  daemon_create: (item) => ({
    text: t("用户 {{operator_name}} 创建了守护进程 {{daemon_id}}"),
    data: [item.operator_name || item.operation_id, item.daemon_id]
  }),
  daemon_remove: (item) => ({
    text: t("用户 {{operator_name}} 删除了守护进程 {{daemon_id}}"),
    data: [item.operator_name || item.operation_id, item.daemon_id]
  }),
  daemon_config_change: (item) => ({
    text: t("用户 {{operator_name}} 修改了守护进程 {{daemon_id}} 配置"),
    data: [item.operator_name || item.operation_id, item.daemon_id]
  }),
  user_create: (item) => ({
    text: t("用户 {{operator_name}} 创建了用户 {{target_user_name}}"),
    data: [item.operator_name || item.operation_id, item.target_user_name]
  }),
  user_delete: (item) => ({
    text: t("用户 {{operator_name}} 删除了用户 {{target_user_name}}"),
    data: [item.operator_name || item.operation_id, item.target_user_name]
  }),
  user_config_change: (item) => ({
    text: t("用户 {{operator_name}} 修改了用户配置"),
    data: [item.operator_name || item.operation_id]
  }),
  system_config_change: (item) => ({
    text: t("用户 {{operator_name}} 修改了系统配置"),
    data: [item.operator_name || item.operation_id]
  })
};

export const useOperationLog = () => {
  const logs = ref<OperationLoggerItem[]>([]);
  const logsData = ref<LogsData[]>([]);

  const levelColors = {
    info: "blue",
    warning: "orange",
    error: "red",
    unknow: "gray"
  };

  const fetchData = async () => {
    const { execute } = getOperationLog();
    const data = await execute();
    logs.value = data.value?.reverse() || [];
    logsData.value = generateTimelineByLogs();
  };

  const generateTextByItem = (item: OperationLoggerItem) => {
    const handler = renderMap[item.type];
    if (!handler) return t("未知操作");
    const { text, data } = handler(item as any);
    let i = 0;
    return text.replace(/\{\{\s*[\w_]+\s*\}\}/g, () => data[i++] ?? "--");
  };

  const generateTimelineByLogs = () => {
    const result: LogsData[] = [];
    let currentGroup: LogsDataItem[] = [];

    for (const log of logs.value) {
      const item = { ...log, text: generateTextByItem(log) };

      if (
        currentGroup.length === 0 ||
        currentGroup[currentGroup.length - 1].operation_level === log.operation_level
      ) {
        currentGroup.push(item);
        continue;
      }

      result.push({
        color: levelColors[currentGroup[0].operation_level] ?? levelColors.unknow,
        item: currentGroup
      });

      currentGroup = [item];
    }

    if (currentGroup.length) {
      result.push({
        color: levelColors[currentGroup[0].operation_level] ?? levelColors.unknow,
        item: currentGroup
      });
    }
    return result;
  };

  return { fetchData, logs, logsData };
};
