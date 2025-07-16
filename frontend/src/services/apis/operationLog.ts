import { useDefineApi } from "@/stores/useDefineApi";

export const getOperationLog = useDefineApi<
  {
    data: {
      limit?: number;
    };
  },
  string
>({
  url: "/api/overview/operation_logs",
  method: "GET"
});
