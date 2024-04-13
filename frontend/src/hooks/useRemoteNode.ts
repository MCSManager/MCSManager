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
    name: ""
  });
  const ALL = "all";
  const currentStatus = ref<any>(ALL);
  const { state, refresh } = useOverviewInfo();
  const refreshLoading = ref(false);

  const remoteNodes = computed(() => {
    const filterByName = (node: ComputedNodeInfo) =>
      operationForm.value.name !== ""
        ? node.remarks.toLowerCase().includes(operationForm.value.name.toLowerCase())
        : true;
    return state.value?.remote.filter(
      (node) =>
        (currentStatus.value === ALL || node.available === currentStatus.value) &&
        filterByName(node)
    );
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
