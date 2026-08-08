import { useDefineApi } from "@/stores/useDefineApi";
import type { OperationLogQueryResult, OperationLoggerItem } from "@/types/operationLog";

export const getOperationLog = useDefineApi<
  {
    data: {
      limit?: number;
    };
  },
  OperationLoggerItem[]
>({
  url: "/api/overview/operation_logs",
  method: "GET"
});

export const searchOperationLog = useDefineApi<
  {
    params: {
      page: number;
      page_size: number;
      type?: string;
      level?: string;
      operator_name?: string;
      start_time?: number;
      end_time?: number;
      keyword?: string;
    };
  },
  OperationLogQueryResult
>({
  url: "/api/overview/operation_logs/search",
  method: "GET"
});
