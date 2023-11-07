<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, onMounted, computed, h } from "vue";
import { t } from "@/lang/i18n";
import {
  SearchOutlined,
  DownOutlined,
  FormOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  FrownOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { router } from "@/config/router";
import { remoteInstances, remoteNodeList } from "@/services/apis";
import { batchStart, batchStop, batchKill, batchDelete } from "@/services/apis/instance";
import type { NodeStatus } from "../types/index";
import { message, notification, Modal } from "ant-design-vue";
import { computeNodeName } from "../tools/nodes";
import Loading from "@/components/Loading.vue";
import { useInstanceInfo } from "@/hooks/useInstance";
import type { InstanceMoreDetail } from "../hooks/useInstance";
import { useInstanceMoreDetail } from "../hooks/useInstance";
import { throttle } from "lodash";
import { useScreen } from "@/hooks/useScreen";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const operationForm = ref({
  instanceName: "",
  currentPage: 1,
  pageSize: 20
});

const currentRemoteNode = ref<NodeStatus>();

const { execute: getNodes, state: nodes } = remoteNodeList();
const { execute: getInstances, state: instances, isLoading } = remoteInstances();

const instancesMoreInfo = computed(() => {
  const newInstances: InstanceMoreDetail[] = [];
  for (const instance of instances.value?.data || []) {
    const instanceMoreInfo = useInstanceMoreDetail(instance);
    newInstances.push(instanceMoreInfo);
  }
  return newInstances;
});

const initNodes = async () => {
  await getNodes();
  if (!nodes.value?.length) {
    return message.error(t("TXT_CODE_e3d96a26"));
  }
  if (localStorage.getItem("pageSelectedRemote")) {
    currentRemoteNode.value = JSON.parse(localStorage.pageSelectedRemote);
  } else {
    currentRemoteNode.value = nodes.value[0];
  }
};

const initInstancesData = async () => {
  selectedInstance.value = [];
  if (!currentRemoteNode.value) {
    await initNodes();
  }
  try {
    await getInstances({
      params: {
        remote_uuid: currentRemoteNode.value?.uuid ?? "",
        page: operationForm.value.currentPage,
        page_size: operationForm.value.pageSize,
        instance_name: operationForm.value.instanceName.trim()
      }
    });
  } catch (err) {
    return message.error(t("访问远程节点异常"));
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

const handleChangeNode = async (item: NodeStatus) => {
  try {
    currentRemoteNode.value = item;
    selectedInstance.value = [];
    await initInstancesData();
    localStorage.setItem("pageSelectedRemote", JSON.stringify(item));
  } catch (err: any) {
    console.error(err.message);
  }
};

const toCreateAppPage = () => {
  router.push({
    path: `/quickstart`
  });
};

const multipleMode = ref(false);
const selectedInstance = ref<InstanceMoreDetail[]>([]);

const findInstance = (item: InstanceMoreDetail) => {
  return selectedInstance.value.some((i) => JSON.stringify(i) === JSON.stringify(item));
};

const selectInstance = (item: InstanceMoreDetail) => {
  if (findInstance(item)) {
    selectedInstance.value.splice(selectedInstance.value.indexOf(item), 1);
  } else {
    selectedInstance.value.push(item);
  }
};

const handleSelectInstance = (item: InstanceMoreDetail) => {
  if (multipleMode.value) {
    selectInstance(item);
  } else {
    toAppDetailPage(currentRemoteNode.value?.uuid || "", item.instanceUuid);
  }
};

const selectAllInstances = () => {
  if (instancesMoreInfo.value.length === selectedInstance.value.length) {
    selectedInstance.value = [];
  } else {
    for (const item of instancesMoreInfo.value) {
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
    title: t("TXT_CODE_7b67813a"),
    icon: CloseOutlined,
    click: () => {
      batchOperation("kill");
    }
  },
  {
    title: t("删除"),
    icon: DeleteOutlined,
    click: () => batchDeleteInstance(false)
  },
  {
    title: t("彻底删除"),
    icon: WarningOutlined,
    click: () => batchDeleteInstance(true)
  }
];

const batchOperation = async (actName: "start" | "stop" | "kill") => {
  if (selectedInstance.value.length === 0) return message.error(t("无法执行，请至少选择一个实例"));
  const operationMap = {
    start: async () => exec(batchStart().execute, t("开启命令已发出")),
    stop: async () => exec(batchStop().execute, t("关闭命令已发出")),
    kill: async () => exec(batchKill().execute, t("终止命令已发出"))
  };

  const exec = async (fn: Function, msg: string) => {
    try {
      const state = await fn({
        data: selectedInstance.value.map((item) => ({
          instanceUuid: item.instanceUuid,
          serviceUuid: currentRemoteNode.value?.uuid ?? ""
        }))
      });
      if (state.value) {
        notification.success({
          message: msg,
          description: t(
            "已成功向各个远程主机发布命令，具体操作可能略有延时，请稍等一段时间后查看结果"
          )
        });
        exitMultipleMode();
        await initInstancesData();
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.message);
    }
  };

  operationMap[actName]();
};

const batchDeleteInstance = async (deleteFile: boolean) => {
  if (selectedInstance.value.length === 0) return message.error(t("无法执行，请至少选择一个实例"));
  const { execute, state } = batchDelete();
  const uuids = [""];
  for (const i of selectedInstance.value) {
    uuids.push(i.instanceUuid);
  }
  const thisModal = Modal.confirm({
    title: t("最终确认"),
    icon: h(InfoCircleOutlined),
    content: deleteFile
      ? t("确定要删除此实例和文件吗？此操作将会删除实例目录的所有文件，请谨慎操作")
      : t("确定要进行批量移除吗？此操作不会删除实例实际文件，只会删除实例"),
    okText: t("确定"),
    async onOk() {
      try {
        await execute({
          params: {
            remote_uuid: currentRemoteNode.value?.uuid ?? ""
          },
          data: {
            uuids: uuids,
            deleteFile: deleteFile
          }
        });
        if (state.value) {
          thisModal.destroy();
          exitMultipleMode();
          notification.success({
            message: t("批量删除成功"),
            description: t("可能会存在一定延迟，文件删除需要一定的时间")
          });
          await initInstancesData();
        }
      } catch (err: any) {
        console.error(err);
        message.error(err.message);
      }
    },
    onCancel() {}
  });
};

onMounted(async () => {
  await initInstancesData();
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              <AppstoreOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-for="item in nodes"
                    :key="item.uuid"
                    @click="handleChangeNode(item)"
                  >
                    <DatabaseOutlined v-if="item.available" />
                    <FrownOutlined v-else />
                    {{ computeNodeName(item.ip, item.available, item.remarks) }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="toNodesPage">
                    <FormOutlined />
                    {{ t("TXT_CODE_28e53fed") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button class="mr-12">
                {{
                  computeNodeName(
                    currentRemoteNode?.ip || "",
                    currentRemoteNode?.available || true,
                    currentRemoteNode?.remarks
                  )
                }}
                <DownOutlined />
              </a-button>
            </a-dropdown>
            <a-button type="primary" @click="toCreateAppPage">
              {{ t("TXT_CODE_53408064") }}
            </a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value="operationForm.instanceName"
                :placeholder="t('TXT_CODE_ce132192')"
                @press-enter="handleQueryInstance"
                @change="handleQueryInstance"
              >
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="instances" #left>
            <div v-if="multipleMode">
              <a-button class="mr-10" :class="{ 'mb-10': isPhone }" @click="exitMultipleMode">
                退出批量操作
              </a-button>

              <a-button
                v-if="instancesMoreInfo.length === selectedInstance.length"
                class="mr-10"
                :class="{ 'mb-10': isPhone }"
                @click="selectedInstance = []"
              >
                取消全选
              </a-button>
              <a-button
                v-else
                class="mr-10"
                :class="{ 'mb-10': isPhone }"
                @click="selectAllInstances"
              >
                全选
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
                  {{ t("选中项") }}
                  <DownOutlined />
                </a-button>
              </a-dropdown>
            </div>
            <div v-else>
              <a-button @click="multipleMode = true">批量操作</a-button>
            </div>
          </template>
          <template v-if="multipleMode" #center>
            <a-typography-text> 已选择：{{ selectedInstance.length }} 项 </a-typography-text>
          </template>
          <template v-if="instances" #right>
            <a-pagination
              v-model:current="operationForm.currentPage"
              v-model:pageSize="operationForm.pageSize"
              :total="instances.maxPage * operationForm.pageSize"
              show-size-changer
              @change="initInstancesData"
            />
          </template>
        </BetweenMenus>
      </a-col>
      <template v-if="instancesMoreInfo">
        <a-col v-for="item in instancesMoreInfo" :key="item" :span="24" :md="6">
          <CardPanel
            class="instance-card"
            :class="{ selected: multipleMode && findInstance(item) }"
            style="height: 100%"
            @click="handleSelectInstance(item)"
          >
            <template #title>
              {{ item.config.nickname }}
            </template>
            <template #body>
              <a-typography-paragraph>
                <div>
                  {{ t("TXT_CODE_e70a8e24") }}
                  <span v-if="item.moreInfo?.isRunning" class="color-success">
                    <CheckCircleOutlined />
                    {{ item.moreInfo?.statusText }}
                  </span>
                  <span v-else-if="item.moreInfo?.isStopped" class="color-info">
                    {{ item.moreInfo?.statusText }}
                  </span>
                  <span v-else>
                    <ExclamationCircleOutlined />
                    {{ item.moreInfo?.statusText }}
                  </span>
                </div>
                <div>
                  {{ t("TXT_CODE_68831be6") }}
                  {{ item.moreInfo?.instanceTypeText }}
                </div>
                <div>
                  {{ t("TXT_CODE_d31a684c") }}
                  {{ item.config.lastDatetime }}
                </div>
                <div>
                  {{ t("TXT_CODE_ae747cc0") }}
                  {{ item.config.endTime }}
                </div>
              </a-typography-paragraph>
            </template>
          </CardPanel>
        </a-col>
      </template>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.search-input {
  transition: all 0.6s;
  text-align: center;
  width: 50%;
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
.instance-card {
  cursor: pointer;
}
.instance-card:hover {
  border: 1px solid var(--color-gray-8);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
}

.selected {
  border: 3px solid var(--color-blue-6);
  transition: all 0.1s;
  &:hover {
    border: 3px solid var(--color-blue-6);
  }
}
</style>
