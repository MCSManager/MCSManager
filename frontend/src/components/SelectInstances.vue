<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { UserInstance, MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import {
  SearchOutlined,
  DownOutlined,
  FormOutlined,
  DatabaseOutlined,
  FrownOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { remoteInstances } from "@/services/apis";
import { remoteNodeList } from "../services/apis";
import type { NodeStatus } from "../types/index";
import { message } from "ant-design-vue";
import { computeNodeName } from "../tools/nodes";
import { throttle } from "lodash";

const props = defineProps<MountComponent>();

const open = ref(false);

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent(1000);
};

const operationForm = ref({
  instanceName: "",
  currentPage: 1,
  pageSize: 10
});

const currentRemoteNode = ref<NodeStatus>();

const { execute: getNodes, state: nodes } = remoteNodeList();
const { execute: getInstances, state: instances, isLoading } = remoteInstances();

const instancesList = computed(() => {
  const newInstances: UserInstance[] = [];
  for (const instance of instances.value?.data || []) {
    newInstances.push({
      instanceUuid: instance.instanceUuid,
      serviceUuid: currentRemoteNode.value?.uuid ?? "",
      nickname: instance.config.nickname,
      status: instance.status,
      hostIp: `${currentRemoteNode.value?.ip}:${currentRemoteNode.value?.port}`
    });
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

const selectedItems = ref<UserInstance[]>([]);

const columns = [
  {
    align: "center",
    title: t("实例名称"),
    dataIndex: "nickname",
    key: "instanceUuid"
  },
  {
    align: "center",
    title: t("操作"),
    key: "operation"
  }
];

const selectItem = (item: UserInstance) => {
  selectedItems.value.push(item);
};

const findItem = (item: UserInstance) => {
  return selectedItems.value.some((i) => JSON.stringify(i) === JSON.stringify(item));
};

const removeItem = (item: UserInstance) => {
  selectedItems.value.splice(selectedItems.value.indexOf(item), 1);
};

const submit = async () => {
  if (props.emitResult) props.emitResult(selectedItems.value);
  await cancel();
};

onMounted(async () => {
  await initInstancesData();
  open.value = true;
});

const handleQueryInstance = throttle(async () => {
  await initInstancesData();
}, 600);

const handleChangeNode = async (item: NodeStatus) => {
  try {
    currentRemoteNode.value = item;
    await initInstancesData();
    localStorage.setItem("pageSelectedRemote", JSON.stringify(item));
  } catch (err: any) {
    console.error(err.message);
  }
};
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :title="t('请选择实例')"
    :ok-text="t('保存')"
    :cancel-text="t('取消')"
    @ok="submit"
    @cancel="cancel"
  >
    <a-typography-paragraph>
      <a-typography-text type="secondary">
        {{ t("利用远程主机地址与模糊查询来为此用户增加应用实例") }}
      </a-typography-text>
    </a-typography-paragraph>
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
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
          </template>
          <template #right>
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
        <div v-if="instances" class="flex-between align-center">
          <a-typography-text>
            {{ t("已选择") }} {{ selectedItems.length }} {{ t("项") }}
          </a-typography-text>
          <a-pagination
            v-model:current="operationForm.currentPage"
            v-model:pageSize="operationForm.pageSize"
            :total="instances.maxPage * operationForm.pageSize"
            show-size-changer
            @change="initInstancesData"
          />
        </div>
      </a-col>
      <template v-if="instancesList">
        <a-col :span="24">
          <a-table
            :loading="isLoading"
            :data-source="instancesList"
            :columns="columns"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'operation'">
                <a-button v-if="findItem(record)" danger size="" @click="removeItem(record)">
                  {{ t("移除") }}
                </a-button>
                <a-button v-else size="" @click="selectItem(record)">
                  {{ t("选择") }}
                </a-button>
              </template>
            </template>
          </a-table>
        </a-col>
      </template>
    </a-row>
  </a-modal>
</template>

<style lang="scss" scoped>
.instance-card {
  cursor: pointer;
}
.instance-card:hover {
  border: 1px solid var(--color-gray-8);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
}
</style>
