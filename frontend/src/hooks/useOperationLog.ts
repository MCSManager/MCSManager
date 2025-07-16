import { ref } from "vue";
import { getOperationLog } from "@/services/apis/operationLog";

export const useOperationLog = () => {
  const fetchData = async () => {
    const { execute } = getOperationLog();
    const data = await execute();
    console.log(data);
  };

  return { fetchData };
};
