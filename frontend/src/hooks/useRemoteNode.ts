import { ref, computed } from "vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import {
  editNode as editNodeApi,
  addNode as addNodeApi,
  deleteNode as deleteNodeApi,
  connectNode
} from "@/services/apis";

export interface RemoteNodeDetail {
  ip: string;
  port: number;
  prefix: string;
  remarks: string;
  apiKey?: string;
}

export function useRemoteNode() {
  const operationForm = ref({
    name: "",
    current: 1,
    pageSize: 10,
    total: 0
  });
  const ALL = "all";
  const currentStatus = ref<any>(ALL);
  const { state, refresh } = useOverviewInfo();
  const refreshLoading = ref(false);

  const filterByName = (node: ComputedNodeInfo) => {
    return operationForm.value.name !== ""
      ? node.remarks.toLowerCase().includes(operationForm.value.name.toLowerCase())
      : true;
  };

  const remoteNodes = computed(() => {
    const nodeList = state.value?.remote;

    const filteredNodes =
      nodeList?.filter(
        (node) =>
          (currentStatus.value === ALL || node.available === currentStatus.value) &&
          filterByName(node)
      ) || [];

    operationForm.value.total = filteredNodes.length || 0;

    const startIndex = (operationForm.value.current - 1) * operationForm.value.pageSize;
    const endIndex = startIndex + operationForm.value.pageSize;

    const sliceFilteredNodes = filteredNodes.slice(startIndex, endIndex);

    if (sliceFilteredNodes.length === 0 && operationForm.value.current > 1) {
      operationForm.value.current -= 1;
      refresh();
    }

    return sliceFilteredNodes;
  });

  const addNode = async (data: any) => {
    await addNodeApi().execute({
      data
    });
    await refresh(true);
  };

  const deleteNode = async (uuid: string) => {
    await deleteNodeApi().execute({
      params: {
        uuid
      }
    });
    await refresh(true);
  };

  const updateNode = async (uuid: string, data: any) => {
    const { execute } = editNodeApi();
    const { execute: tryConnectNode } = connectNode();
    await execute({
      params: {
        uuid
      },
      data
    });
    await tryConnectNode({
      params: {
        uuid
      }
    });
    await refresh(true);
  };

  return {
    remoteNodes,
    operationForm,
    currentStatus,
    refreshLoading,
    refresh,
    addNode,
    deleteNode,
    updateNode
  };
}
