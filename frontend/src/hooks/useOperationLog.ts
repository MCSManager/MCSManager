import { computed, ref } from "vue";
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
    text: t("TXT_CODE_e4605c4"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_stop: (item) => ({
    text: t("TXT_CODE_48c286cc"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_restart: (item) => ({
    text: t("TXT_CODE_fa7002ef"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_update: (item) => ({
    text: t("TXT_CODE_e1454ba7"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_kill: (item) => ({
    text: t("TXT_CODE_ee54440"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_config_change: (item) => ({
    text: t("TXT_CODE_30fcc19a"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_create: (item) => ({
    text: t("TXT_CODE_9ab6fd"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_delete: (item) => ({
    text: t("TXT_CODE_61b6facb"),
    data: [item.operator_name || item.operation_id, item.instance_name || item.instance_id]
  }),
  instance_file_upload: (item) => ({
    text: t("TXT_CODE_58e4a9bd"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file || ""
    ]
  }),
  instance_file_update: (item) => ({
    text: t("TXT_CODE_c5687e56"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_file_download: (item) => ({
    text: t("TXT_CODE_6f43f95f"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_file_delete: (item) => ({
    text: t("TXT_CODE_de567e84"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.file
    ]
  }),
  instance_task_create: (item) => ({
    text: t("TXT_CODE_5ddb00f2"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.task_name
    ]
  }),
  instance_task_delete: (item) => ({
    text: t("TXT_CODE_41f86ac"),
    data: [
      item.operator_name || item.operation_id,
      item.instance_name || item.instance_id,
      item.task_name
    ]
  }),
  daemon_create: (item) => ({
    text: t("TXT_CODE_f7969e5a"),
    data: [item.operator_name || item.operation_id, item.daemon_id]
  }),
  daemon_remove: (item) => ({
    text: t("TXT_CODE_384d278f"),
    data: [item.operator_name || item.operation_id, item.daemon_id]
  }),
  daemon_config_change: (item) => ({
    text: t("TXT_CODE_b6ac7af4"),
    data: [item.operator_name || item.operation_id, item.daemon_id]
  }),
  user_create: (item) => ({
    text: t("TXT_CODE_faa1962b"),
    data: [item.operator_name || item.operation_id, item.target_user_name]
  }),
  user_delete: (item) => ({
    text: t("TXT_CODE_cd76bc9"),
    data: [item.operator_name || item.operation_id, item.target_user_name]
  }),
  user_config_change: (item) => ({
    text: t("TXT_CODE_5564bc4c"),
    data: [item.operator_name || item.operation_id]
  }),
  system_config_change: (item) => ({
    text: t("TXT_CODE_d6312bd5"),
    data: [item.operator_name || item.operation_id]
  })
};

export const useOperationLog = () => {
  const logs = ref<OperationLoggerItem[]>([]);

  const levelColors = {
    info: "blue",
    warning: "orange",
    error: "red",
    unknown: "gray"
  };

  const fetchData = async () => {
    const { execute } = getOperationLog();
    const data = await execute();
    logs.value = data.value?.reverse() || [];
  };

  const generateTextByItem = (item: OperationLoggerItem) => {
    const handler = renderMap[item.type];
    if (!handler) return t("TXT_CODE_43df9305");
    const { text, data } = handler(item as any);
    let i = 0;
    return text.replace(/\{\{\s*[\w_]+\s*\}\}/g, () => data[i++] ?? "--");
  };

  const getColorByLevel = (level: OperationLoggerItem["operation_level"]) => {
    return levelColors[level] ?? levelColors.unknown;
  };

  const formattedLogs = computed(() => {
    return logs.value.map((item) => {
      return {
        ...item,
        color: getColorByLevel(item.operation_level),
        text: generateTextByItem(item)
      };
    });
  });

  return { fetchData, logs, getColorByLevel, generateTextByItem, formattedLogs };
};
