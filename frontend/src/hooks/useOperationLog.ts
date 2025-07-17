import { ref } from "vue";
import { getOperationLog } from "@/services/apis/operationLog";
import { t } from "@/lang/i18n";
import dayjs from "dayjs";
import type { OperationLoggerItem } from "@/types/operationLog";

type LogsDataItem = OperationLoggerItem & { text: string };
type LogsData = { color: string; item: LogsDataItem[] };

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
    return `用户 ${item.operator_name} 关闭实例 ${item.operator_name} ${dayjs(
      +item.operation_time
    ).format("YYYY-MM-DD HH:mm:ss")}`;
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
