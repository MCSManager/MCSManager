<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types/index";
import {
  AppstoreOutlined,
  CloseOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownOutlined,
  FormOutlined,
  FrownOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SearchOutlined,
  WarningOutlined
} from "@ant-design/icons-vue";
import { computed, h, onMounted, ref, watch } from "vue";

import BetweenMenus from "@/components/BetweenMenus.vue";
import { router } from "@/config/router";
import { useInstanceTagSearch, useInstanceTagTips } from "@/hooks/useInstanceTag";
import { useScreen } from "@/hooks/useScreen";
import { remoteInstances, remoteNodeList } from "@/services/apis";
import {
  batchDelete,
  batchKill,
  batchRestart,
  batchStart,
  batchStop
} from "@/services/apis/instance";
import { formatMemoryUsage } from "@/tools/memory";
import { reportErrorMsg } from "@/tools/validator";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import { Modal, notification } from "ant-design-vue";
import { throttle } from "lodash";
import { useRoute } from "vue-router";
import type { InstanceMoreDetail } from "../hooks/useInstance";
import { useInstanceMoreDetail } from "../hooks/useInstance";
import { computeNodeName } from "../tools/nodes";
import type { NodeStatus } from "../types/index";
import InstanceWorkspace from "./instance/InstanceWorkspace.vue";
import Shortcut from "./instance/Shortcut.vue";

defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const route = useRoute();
const operationForm = ref({
  instanceName: "",
  currentPage: 1,
  pageSize: 20,
  status: ""
});

const ALL_REMOTE_NODES_ID = "__all__";
interface InstanceListItem extends InstanceMoreDetail {
  daemonId?: string;
  daemonIp?: string;
  daemonPort?: number;
  daemonPrefix?: string;
  daemonRemarks?: string;
  daemonAvailable?: boolean;
}

const currentRemoteNode = ref<NodeStatus>();

const { execute: getNodes, state: nodes, isLoading: isLoading1 } = remoteNodeList();
const { execute: getInstances, state: instances, isLoading: isLoading2 } = remoteInstances();
const { updateTagTips, tagTips } = useInstanceTagTips();
const {
  tags: selectedTags,
  setRefreshFn,
  selectTag,
  removeTag,
  isTagSelected,
  clearTags
} = useInstanceTagSearch();

const isLoading = computed(() => isLoading1.value || isLoading2.value);
const selectedWorkspaceInstance = ref<InstanceListItem>();

const instancesMoreInfo = computed(() => {
  const newInstances: InstanceListItem[] = [];
  for (const instance of instances.value?.data || []) {
    const instanceItem = instance as InstanceListItem;
    if (!instanceItem.daemonId && currentRemoteNode.value?.uuid) {
      instanceItem.daemonId = currentRemoteNode.value.uuid;
    }
    const instanceMoreInfo = useInstanceMoreDetail(instanceItem);
    newInstances.push(instanceMoreInfo);
  }
  return newInstances || [];
});

const initNodes = async () => {
  await getNodes();
  nodes?.value?.sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
  if (nodes.value?.length === 0) {
    return reportErrorMsg(t("TXT_CODE_e3d96a26"));
  }
  currentRemoteNode.value = undefined;
};

const initInstancesData = async (resetPage?: boolean) => {
  try {
    selectedInstance.value = [];
    if (resetPage) operationForm.value.currentPage = 1;
    if (!currentRemoteNode.value) {
      await initNodes();
    }
    await getInstances({
      params: {
        daemonId: currentRemoteNode.value?.uuid ?? ALL_REMOTE_NODES_ID,
        page: operationForm.value.currentPage,
        page_size: operationForm.value.pageSize,
        status: operationForm.value.status,
        instance_name: operationForm.value.instanceName.trim(),
        tag: JSON.stringify(selectedTags.value)
      }
    });
    updateTagTips(instances.value?.allTags || []);
    syncWorkspaceSelection();
  } catch (err) {
    return reportErrorMsg(t("TXT_CODE_e109c091"));
  }
};

const handleQueryInstance = throttle(async () => {
  selectedInstance.value = [];
  await initInstancesData();
}, 600);

const toAppDetailPage = (daemonId: string, instanceId: string) => {
  router.push({
    path: `/instances/terminal`,
    query: {
      daemonId,
      instanceId
    }
  });
};

const getInstanceDaemonId = (item: InstanceListItem) => {
  return item.daemonId || currentRemoteNode.value?.uuid || "";
};

const selectedWorkspaceKey = computed(() => {
  const item = selectedWorkspaceInstance.value;
  if (!item) return "";
  return `${getInstanceDaemonId(item)}:${item.instanceUuid}`;
});

const isSameInstance = (a?: InstanceListItem, b?: InstanceListItem) => {
  if (!a || !b) return false;
  return a.instanceUuid === b.instanceUuid && getInstanceDaemonId(a) === getInstanceDaemonId(b);
};

const findWorkspaceInstance = (daemonId?: string, instanceId?: string) => {
  if (!daemonId || !instanceId) return undefined;
  return instancesMoreInfo.value.find(
    (item) => item.instanceUuid === instanceId && getInstanceDaemonId(item) === daemonId
  );
};

const selectWorkspaceInstance = (item?: InstanceListItem, syncRoute = true) => {
  selectedWorkspaceInstance.value = item;
  if (!item || !syncRoute || isPhone.value) return;

  const daemonId = getInstanceDaemonId(item);
  if (!daemonId) return;
  if (route.query.daemonId === daemonId && route.query.instanceId === item.instanceUuid) return;

  router.replace({
    query: {
      ...route.query,
      daemonId,
      instanceId: item.instanceUuid
    }
  });
};

const syncWorkspaceSelection = (preferRoute = false) => {
  if (isPhone.value) return;
  const list = instancesMoreInfo.value;
  if (!list.length) return selectWorkspaceInstance(undefined, false);

  const routeDaemonId = route.query.daemonId ? String(route.query.daemonId) : "";
  const routeInstanceId = route.query.instanceId ? String(route.query.instanceId) : "";
  const routeMatched = findWorkspaceInstance(routeDaemonId, routeInstanceId);
  const currentMatched = list.find((item) => isSameInstance(item, selectedWorkspaceInstance.value));
  const next = (preferRoute && routeMatched) || currentMatched || routeMatched || list[0];
  selectWorkspaceInstance(next as InstanceListItem);
};

const isWorkspaceSelected = (item: InstanceListItem) => {
  return isSameInstance(item, selectedWorkspaceInstance.value);
};

const getInstanceNodeName = (item: InstanceListItem) => {
  if (item.daemonRemarks) return item.daemonRemarks;
  if (item.daemonIp) return `${item.daemonIp}:${item.daemonPort || ""}`;
  return getCurrentNodeName();
};

const getInstanceStatusColor = (item: InstanceListItem) => {
  if (item.status === INSTANCE_STATUS_CODE.RUNNING) return "green";
  if (item.status === INSTANCE_STATUS_CODE.STARTING || item.status === INSTANCE_STATUS_CODE.BUSY)
    return "pink";
  return "";
};

const getInstanceMemoryText = (item: InstanceListItem) => {
  if (item.info?.memoryUsage == null) return "--";
  return formatMemoryUsage(item.info.memoryUsage, item.info.memoryLimit);
};

const getInstanceCpuText = (item: InstanceListItem) => {
  if (item.info?.cpuUsage == null) return "--";
  return `${Number(item.info.cpuUsage).toFixed(1)}%`;
};

const handleSidebarInstanceClick = (item: InstanceListItem) => {
  if (multipleMode.value) {
    selectInstance(item);
    return;
  }
  selectWorkspaceInstance(item);
};

const getCurrentNodeName = () => {
  if (!currentRemoteNode.value) return t("TXT_CODE_4bedec2a");
  return computeNodeName(
    currentRemoteNode.value.ip || "",
    currentRemoteNode.value.available || true,
    currentRemoteNode.value.remarks
  );
};

const handleChangeAllNodes = async () => {
  try {
    currentRemoteNode.value = undefined;
    selectedInstance.value = [];
    localStorage.removeItem("pageSelectedRemote");
    await initInstancesData(true);
  } catch (err: any) {
    console.error(err.message);
  }
};

const handleChangeNode = async (item: NodeStatus) => {
  try {
    currentRemoteNode.value = item;
    selectedInstance.value = [];
    await initInstancesData(true);
  } catch (err: any) {
    console.error(err.message);
  }
};

const toCreateAppPage = () => {
  router.push({
    path: "/market",
    query: {
      daemonId: currentRemoteNode.value?.uuid
    }
  });
};

const toMarketPage = () => {
  router.push({
    path: "/market",
    query: {
      daemonId: currentRemoteNode.value?.uuid
    }
  });
};

const toNodesPage = () => {
  router.push({
    path: "/node"
  });
};

const multipleMode = ref(false);
const selectedInstance = ref<InstanceListItem[]>([]);

const findInstance = (item: InstanceListItem) => {
  return selectedInstance.value.find(
    (i) => i.instanceUuid === item.instanceUuid && getInstanceDaemonId(i) === getInstanceDaemonId(item)
  );
};

const selectInstance = (item: InstanceListItem) => {
  const selected = findInstance(item);
  if (selected) {
    selectedInstance.value.splice(selectedInstance.value.indexOf(selected), 1);
  } else {
    selectedInstance.value.push(item);
  }
};

const handleSelectInstance = (item: InstanceMoreDetail) => {
  if (multipleMode.value) {
    selectInstance(item as InstanceListItem);
  } else {
    toAppDetailPage(getInstanceDaemonId(item as InstanceListItem), item.instanceUuid);
  }
};

const selectAllInstances = () => {
  if (instancesMoreInfo.value.length === selectedInstance.value.length) {
    selectedInstance.value = [];
  } else {
    for (const item of instancesMoreInfo.value) {
      if (findInstance(item)) continue;
      selectedInstance.value.push(item);
    }
  }
};

const exitMultipleMode = () => {
  multipleMode.value = false;
  selectedInstance.value = [];
};

const instanceOperations = [
  {
    title: t("TXT_CODE_57245e94"),
    icon: PlayCircleOutlined,
    click: () => batchOperation("start")
  },
  {
    title: t("TXT_CODE_b1dedda3"),
    icon: PauseCircleOutlined,
    click: () => batchOperation("stop")
  },
  {
    title: t("TXT_CODE_47dcfa5"),
    icon: RedoOutlined,
    click: () => batchOperation("restart")
  },
  {
    title: t("TXT_CODE_7b67813a"),
    icon: CloseOutlined,
    click: () => {
      batchOperation("kill");
    }
  },
  {
    title: t("TXT_CODE_ecbd7449"),
    icon: DeleteOutlined,
    click: () => batchDeleteInstance(false)
  },
  {
    title: t("TXT_CODE_9ef27367"),
    icon: WarningOutlined,
    click: () => batchDeleteInstance(true)
  }
];

const batchOperation = async (actName: "start" | "stop" | "kill" | "restart") => {
  if (selectedInstance.value.length === 0) return reportErrorMsg(t("TXT_CODE_a0a77be5"));
  const operationMap = {
    start: async () => exec(batchStart().execute, t("TXT_CODE_2b5fd76e")),
    stop: async () => exec(batchStop().execute, t("TXT_CODE_4822a21")),
    kill: async () => exec(batchKill().execute, t("TXT_CODE_effefaab")),
    restart: async () => exec(batchRestart().execute, t("TXT_CODE_effefaab"))
  };

  const exec = async (fn: Function, msg: string) => {
    try {
      if (selectedInstance.value.some((item) => !getInstanceDaemonId(item))) {
        return reportErrorMsg(t("TXT_CODE_e109c091"));
      }
      const state = await fn({
        data: selectedInstance.value.map((item) => ({
          instanceUuid: item.instanceUuid,
          daemonId: getInstanceDaemonId(item)
        }))
      });
      if (state.value) {
        notification.success({
          message: msg,
          description: t("TXT_CODE_1514d08f")
        });
        exitMultipleMode();
        await initInstancesData();
      }
    } catch (err: any) {
      console.error(err);
      reportErrorMsg(err.message);
    }
  };

  operationMap[actName]();
};

const batchDeleteInstance = async (deleteFile: boolean) => {
  if (selectedInstance.value.length === 0) return reportErrorMsg(t("TXT_CODE_a0a77be5"));
  const { execute, state } = batchDelete();
  const groupedUuids = new Map<string, string[]>();
  const paths: string[] = [];
  for (const i of selectedInstance.value) {
    const daemonId = getInstanceDaemonId(i);
    if (!daemonId) return reportErrorMsg(t("TXT_CODE_e109c091"));
    if (!groupedUuids.has(daemonId)) groupedUuids.set(daemonId, []);
    groupedUuids.get(daemonId)?.push(i.instanceUuid);
    if (i.config?.cwd) {
      paths.push(i.config.cwd);
    }
  }
  const confirmDeleteInstanceModal = Modal.confirm({
    title: t("TXT_CODE_2a3b0c17"),
    icon: h(InfoCircleOutlined),
    content: () =>
      h("div", {}, [
        h("p", {}, deleteFile ? t("TXT_CODE_18d2f8ae") : t("TXT_CODE_ac01315a")),
        paths.length > 1
          ? null
          : h("p", { style: "margin-top: 8px; color: #666;" }, [
              t("TXT_CODE_91d70059"),
              h("br"),
              paths.join()
            ])
      ]),
    okText: t("TXT_CODE_d507abff"),
    async onOk() {
      try {
        for (const [daemonId, uuids] of groupedUuids.entries()) {
          await execute({
            params: {
              daemonId
            },
            data: {
              uuids,
              deleteFile
            }
          });
        }
        if (state.value) {
          confirmDeleteInstanceModal.destroy();
          exitMultipleMode();
          notification.success({
            message: t("TXT_CODE_c3c06801"),
            description: t("TXT_CODE_50075e02")
          });
          await initInstancesData(true);
        }
      } catch (err: any) {
        console.error(err);
        reportErrorMsg(err.message);
      }
    },
    onCancel() {}
  });
};

watch(
  () => [route.query.daemonId, route.query.instanceId],
  () => syncWorkspaceSelection(true)
);

watch(isPhone, () => {
  syncWorkspaceSelection(true);
});

onMounted(async () => {
  await initInstancesData();
  setRefreshFn(initInstancesData);
});
</script>

<template>
  <div style="min-height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="min-height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              <AppstoreOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item :key="ALL_REMOTE_NODES_ID" @click="handleChangeAllNodes">
                    <DatabaseOutlined />
                    {{ t("TXT_CODE_4bedec2a") }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item
                    v-for="item in nodes"
                    :key="item.uuid"
                    :disabled="!item.available"
                    @click="handleChangeNode(item)"
                  >
                    <DatabaseOutlined v-if="item.available" />
                    <FrownOutlined v-else />
                    {{ computeNodeName(item.ip, item.available, item.remarks) }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="toNodesPage" @click="toNodesPage()">
                    <FormOutlined />
                    {{ t("TXT_CODE_28e53fed") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button style="max-width: 200px; min-width: 180px; overflow: hidden">
                <a-typography-text
                  style="max-width: 145px"
                  :ellipsis="{ ellipsis: true }"
                  :content="getCurrentNodeName()"
                />
                <DownOutlined />
              </a-button>
            </a-dropdown>
            <a-button
              type="primary"
              :disabled="!currentRemoteNode?.available"
              @click="toCreateAppPage"
            >
              {{ t("TXT_CODE_53408064") }}
            </a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input-group compact>
                <a-select
                  v-model:value="operationForm.status"
                  style="width: 90px"
                  @change="handleQueryInstance"
                >
                  <a-select-option value="">
                    {{ t("TXT_CODE_c48f6f64") }}
                  </a-select-option>
                  <a-select-option v-for="(p, i) in INSTANCE_STATUS" :key="i" :value="i">
                    {{ p }}
                  </a-select-option>
                </a-select>
                <a-input
                  v-model:value.trim="operationForm.instanceName"
                  :placeholder="t('TXT_CODE_ce132192')"
                  style="width: calc(100% - 90px)"
                  @press-enter="handleQueryInstance"
                  @change="handleQueryInstance"
                >
                  <template #suffix>
                    <search-outlined />
                  </template>
                </a-input>
              </a-input-group>
            </div>
          </template>
        </BetweenMenus>
      </a-col>
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="instances" #left>
            <div v-if="multipleMode">
              <a-button class="mr-10" @click="exitMultipleMode">
                {{ t("TXT_CODE_5366af54") }}
              </a-button>

              <a-button
                v-if="instancesMoreInfo.length === selectedInstance.length"
                class="mr-10"
                @click="selectedInstance = []"
              >
                {{ t("TXT_CODE_df87c46d") }}
              </a-button>
              <a-button v-else class="mr-10" @click="selectAllInstances">
                {{ t("TXT_CODE_f466d7a") }}
              </a-button>
              <a-dropdown>
                <template #overlay>
                  <a-menu>
                    <a-menu-item
                      v-for="item in instanceOperations"
                      :key="item.title"
                      @click="item.click"
                    >
                      <component :is="item.icon" />
                      {{ item.title }}
                    </a-menu-item>
                  </a-menu>
                </template>
                <a-button type="primary">
                  {{ t("TXT_CODE_8fd8bfd3") }}
                  <DownOutlined />
                </a-button>
              </a-dropdown>
            </div>
            <div v-else>
              <a-button @click="multipleMode = true">{{ t("TXT_CODE_5cb656b9") }}</a-button>
              <a-button class="ml-10" @click="handleQueryInstance">
                {{ t("TXT_CODE_b76d94e0") }}
              </a-button>
            </div>
          </template>
          <template v-if="multipleMode" #center>
            <a-typography-text>
              {{ t("TXT_CODE_432cbc38") }}{{ selectedInstance.length }} {{ t("TXT_CODE_5cd3b4bd") }}
            </a-typography-text>
          </template>
          <template v-if="instances" #right>
            <a-pagination
              v-model:current="operationForm.currentPage"
              v-model:pageSize="operationForm.pageSize"
              :total="(instances?.maxPage || 0) * operationForm.pageSize"
              show-size-changer
              @change="initInstancesData()"
            />
          </template>
        </BetweenMenus>
      </a-col>
      <a-col :span="24">
        <div v-if="tagTips && tagTips?.length > 0" class="instances-tag-container">
          <a-tag
            v-if="selectedTags.length > 0"
            color="red"
            class="group-name-tag"
            @click="clearTags"
          >
            {{ t("TXT_CODE_7333c7f7") }}
          </a-tag>
          <a-tag
            v-for="item in tagTips"
            :key="item"
            class="group-name-tag"
            :class="{ 'group-name-tag-active': isTagSelected(item) }"
            @click="isTagSelected(item) ? removeTag(item) : selectTag(item)"
          >
            {{ item }}
          </a-tag>
        </div>
      </a-col>
      <a-col v-if="isLoading" :span="24">
        <Loading></Loading>
      </a-col>

      <a-col v-else-if="instancesMoreInfo.length > 0 && !isPhone" :span="24">
        <div class="instance-workbench">
          <aside class="instance-workbench__sidebar">
            <div class="instance-workbench__sidebar-title">
              <span>实例列表</span>
              <a-tag>{{ instancesMoreInfo.length }}</a-tag>
            </div>
            <div class="instance-workbench__list">
              <button
                v-for="item in instancesMoreInfo"
                :key="`${getInstanceDaemonId(item)}:${item.instanceUuid}`"
                type="button"
                class="instance-workbench__list-item"
                :class="{
                  active: !multipleMode && isWorkspaceSelected(item),
                  selected: multipleMode && findInstance(item)
                }"
                @click="handleSidebarInstanceClick(item)"
              >
                <div class="instance-workbench__item-main">
                  <span class="instance-workbench__item-name">{{ item.config.nickname }}</span>
                  <a-tag :color="getInstanceStatusColor(item)">
                    {{ item.moreInfo?.statusText || INSTANCE_STATUS[item.status] || "--" }}
                  </a-tag>
                </div>
                <div class="instance-workbench__item-node">
                  {{ getInstanceNodeName(item) }}
                </div>
                <div class="instance-workbench__item-meta">
                  <span>{{ item.moreInfo?.instanceTypeText || "--" }}</span>
                  <span>CPU {{ getInstanceCpuText(item) }}</span>
                  <span>{{ t("TXT_CODE_593ee330") }} {{ getInstanceMemoryText(item) }}</span>
                </div>
                <div v-if="item.config.tag?.length" class="instance-workbench__item-tags">
                  <a-tag v-for="tag in item.config.tag" :key="tag" class="m-0">
                    {{ tag }}
                  </a-tag>
                </div>
              </button>
            </div>
          </aside>

          <main class="instance-workbench__main">
            <InstanceWorkspace
              v-if="selectedWorkspaceInstance"
              :key="selectedWorkspaceKey"
              :card="card"
              :target-instance-info="selectedWorkspaceInstance"
              :target-daemon-id="getInstanceDaemonId(selectedWorkspaceInstance)"
              @refresh-list="initInstancesData()"
            />
          </main>
        </div>
      </a-col>

      <a-col v-else-if="instancesMoreInfo.length > 0" :span="24">
        <a-row :gutter="[16, 16]">
          <fade-up-animation>
            <a-col
              v-for="item in instancesMoreInfo"
              :key="`${getInstanceDaemonId(item)}:${item.instanceUuid}`"
              :span="24"
              :xl="6"
              :lg="8"
              :sm="12"
            >
              <Shortcut
                class="instance-card"
                :class="{ selected: multipleMode && findInstance(item) }"
                style="height: 100%"
                :card="card"
                :target-instance-info="item"
                :target-daemon-id="getInstanceDaemonId(item)"
                @click="handleSelectInstance(item)"
                @refresh-list="initInstancesData()"
              />
            </a-col>
          </fade-up-animation>
        </a-row>
      </a-col>

      <a-col
        v-else-if="instancesMoreInfo.length === 0"
        :span="24"
        class="flex align-center justify-center h-100 w-100 flex-col"
        style="position: relative"
      >
        <div>
          <Empty :description="t('TXT_CODE_5415f009')" />
        </div>
        <div class="mt-20">
          <a-button type="primary" @click="toMarketPage">
            {{ t("TXT_CODE_871cb8bc") }}
          </a-button>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.instance-workbench {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr);
  gap: 18px;
  align-items: flex-start;
  min-height: 620px;
}

.instance-workbench__sidebar,
.instance-workbench__main {
  border: 1px solid var(--card-border-color);
  border-radius: 16px;
  background: rgba(250, 252, 255, 0.86);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.instance-workbench__sidebar {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 160px);
  min-height: 620px;
  overflow: hidden;
}

.instance-workbench__sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--card-border-color);
  font-weight: 700;
}

.instance-workbench__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 12px;
}

.instance-workbench__list-item {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 13px;
  padding: 12px;
  background: var(--color-gray-1);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-gray-6);
    transform: translateY(-1px);
  }

  &.active {
    border-color: var(--color-primary);
    background: rgba(64, 150, 255, 0.08);
  }

  &.selected {
    border-color: var(--color-green-3);
    background: var(--color-green-1);
  }
}

.instance-workbench__item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.instance-workbench__item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.instance-workbench__item-node {
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-gray-7);
  font-size: 12px;
}

.instance-workbench__item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: var(--color-gray-7);
  font-size: 12px;
}

.instance-workbench__item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.instance-workbench__main {
  min-width: 0;
  padding: 18px;
}

.search-input {
  transition: all 0.6s;
  text-align: center;
  width: 80%;
}

@media (max-width: 992px) {
  .search-input {
    transition: all 0.4s;
    text-align: center;
    width: 100% !important;
  }
}

.search-input:hover {
  width: 100%;
}

.instances-tag-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-right: -4px;
  margin-left: -4px;
  max-height: 114px;
  overflow-y: auto;

  .group-name-tag {
    background-color: var(--color-gray-4);
    margin: 4px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.3s;
    &:hover {
      border-color: var(--color-gray-8);
    }
  }

  .group-name-tag-active {
    background-color: var(--color-green-1) !important;
    border-color: var(--color-green-3);
    color: var(--color-green-7);
  }
}
</style>
