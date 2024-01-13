<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import BetweenMenus from "../BetweenMenus.vue";
import type { MountComponent, NodeStatus } from "@/types";
import type { UserInstance } from "@/types/user";
import { t } from "@/lang/i18n";
import {
  SearchOutlined,
  DownOutlined,
  FormOutlined,
  DatabaseOutlined,
  FrownOutlined
} from "@ant-design/icons-vue";
import { reportError } from "@/tools/validator";
import { remoteInstances, remoteNodeList } from "@/services/apis";
import { computeNodeName } from "@/tools/nodes";
import { throttle } from "lodash";
import { useScreen } from "@/hooks/useScreen";
import type { ColumnsType } from "ant-design-vue/es/table";
import type { AntTableCell } from "../../types/ant";
import AppConfigProvider from "../AppConfigProvider.vue";
import { INSTANCE_STATUS } from "@/types/const";

const props = defineProps<MountComponent>();
const { isPhone } = useScreen();

const open = ref(false);

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent(1000);
};

const operationForm = ref({
  instanceName: "",
  currentPage: 1,
  pageSize: 10,
  status: ""
});

const currentRemoteNode = ref<NodeStatus>();

const { execute: getNodes, state: nodes } = remoteNodeList();
const { execute: getInstances, state: instances, isLoading } = remoteInstances();

const instancesList = computed(() => {
  const newInstances: UserInstance[] = [];
  for (const instance of instances.value?.data || []) {
    newInstances.push({
      instanceUuid: instance.instanceUuid,
      daemonId: currentRemoteNode.value?.uuid ?? "",
      nickname: instance.config.nickname,
      status: instance.status,
      hostIp: `${currentRemoteNode.value?.ip}:${currentRemoteNode.value?.port}`
    });
  }
  return newInstances;
});

const initNodes = async () => {
  await getNodes();
  nodes?.value?.sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
  if (!nodes.value?.length) {
    return reportError(t("TXT_CODE_e3d96a26"));
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
        daemonId: currentRemoteNode.value?.uuid ?? "",
        page: operationForm.value.currentPage,
        page_size: operationForm.value.pageSize,
        status: "",
        instance_name: operationForm.value.instanceName.trim()
      }
    });
  } catch (err) {
    return reportError(t("TXT_CODE_e109c091"));
  }
};

const selectedItems = ref<UserInstance[]>([]);

const columns: ColumnsType = [
  {
    align: "center",
    title: t("TXT_CODE_f70badb9"),
    dataIndex: "nickname",
    key: "instanceUuid"
  },
  {
    align: "center",
    title: t("TXT_CODE_fe731dfc"),
    key: "operation"
  }
];

const selectItem = (item: UserInstance) => {
  selectedItems.value.push(item);
};

const findItem = (item: UserInstance) => {
  return selectedItems.value.find((i) => i.instanceUuid === item.instanceUuid);
};

const removeItem = (item: UserInstance) => {
  selectedItems.value = selectedItems.value.filter((i) => i.instanceUuid !== item.instanceUuid);
};

const submit = async () => {
  if (props.emitResult) props.emitResult(selectedItems.value);
  await cancel();
};

onMounted(async () => {
  open.value = true;
  await initInstancesData();
});

const handleQueryInstance = throttle(async () => {
  await initInstancesData();
}, 600);

const handleChangeNode = async (item: NodeStatus) => {
  try {
    operationForm.value.currentPage = 1;
    currentRemoteNode.value = item;
    await initInstancesData();
    localStorage.setItem("pageSelectedRemote", JSON.stringify(item));
  } catch (err: any) {
    console.error(err.message);
  }
};
</script>

<template>
  <AppConfigProvider>
    <a-modal
      v-model:open="open"
      centered
      :mask-closable="false"
      :title="t('TXT_CODE_8145d25a')"
      :ok-text="t('TXT_CODE_abfe9512')"
      :cancel-text="t('TXT_CODE_a0451c97')"
      @ok="submit"
      @cancel="cancel"
    >
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_50697989") }}
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
                      :disabled="!item.available"
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
                <a-button :class="isPhone && 'w-100'">
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
              <div class="search-input w-100">
                <a-input-group compact style="min-width: 175px">
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
          <div v-if="instances" class="flex-between align-center">
            <a-typography-text>
              {{ t("TXT_CODE_379fa48a") }} {{ selectedItems.length }} {{ t("TXT_CODE_5cd3b4bd") }}
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
              :scroll="{
                x: 'max-content'
              }"
            >
              <template #bodyCell="{ column, record }: AntTableCell">
                <template v-if="column.key === 'operation'">
                  <a-button
                    v-if="findItem(record)"
                    danger
                    size="middle"
                    @click="removeItem(record)"
                  >
                    {{ t("TXT_CODE_65fcbd09") }}
                  </a-button>
                  <a-button v-else size="middle" @click="selectItem(record)">
                    {{ t("TXT_CODE_7b2c5414") }}
                  </a-button>
                </template>
              </template>
            </a-table>
          </a-col>
        </template>
      </a-row>
    </a-modal>
  </AppConfigProvider>
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
