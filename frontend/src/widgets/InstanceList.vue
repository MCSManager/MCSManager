<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, onMounted, computed } from "vue";
import { t } from "@/lang/i18n";
import {
  SearchOutlined,
  DownOutlined,
  FormOutlined,
  DatabaseOutlined,
  AppstoreOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { router } from "@/config/router";
import { remoteInstances } from "@/services/apis";
import { remoteNodeList } from "../services/apis";
import type { NodeStatus } from "../types/index";
import { message } from "ant-design-vue";
import { computeNodeName } from "../tools/nodes";
import Loading from "@/components/Loading.vue";
import { useInstanceInfo } from "@/hooks/useInstance";
import type { InstanceMoreDetail } from "../hooks/useInstance";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { useInstanceMoreDetail } from "../hooks/useInstance";
import { throttle } from "lodash";

const props = defineProps<{
  card: LayoutCard;
}>();

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
    return message.error(t("面板未能链接到任何一个远程节点，请先前往节点界面添加远程节点"));
  }
  if (nodes.value?.length > 0) {
    currentRemoteNode.value = nodes.value[0];
  }
};

const initInstancesData = async () => {
  if (!currentRemoteNode.value) {
    await initNodes();
  }
  await getInstances({
    params: {
      remote_uuid: currentRemoteNode.value?.uuid ?? "",
      page: operationForm.value.currentPage,
      page_size: operationForm.value.pageSize,
      instance_name: operationForm.value.instanceName.trim()
    }
  });
};

onMounted(async () => {
  await initInstancesData();
});

const handleQueryInstance = throttle(async () => {
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

const handleChangeNode = () => {};
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
                <a-menu @click="handleChangeNode">
                  <a-menu-item v-for="item in nodes" :key="item.uuid">
                    <DatabaseOutlined />
                    {{ computeNodeName(item.ip, item.remarks) }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="toNodesPage">
                    <FormOutlined />
                    {{ t("管理远程节点") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button class="mr-12">
                {{ computeNodeName(currentRemoteNode?.ip || "", currentRemoteNode?.remarks) }}
                <DownOutlined />
              </a-button>
            </a-dropdown>
            <a-button type="primary">{{ t("新建应用") }}</a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value="operationForm.instanceName"
                :placeholder="t('根据应用名字搜索')"
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
        <div v-if="instances" class="flex justify-end">
          <a-pagination
            v-model:current="operationForm.currentPage"
            v-model:pageSize="operationForm.pageSize"
            :total="instances.maxPage * operationForm.pageSize"
            show-size-changer
            @change="initInstancesData"
          />
        </div>
      </a-col>
      <template v-if="instancesMoreInfo">
        <a-col v-for="item in instancesMoreInfo" :key="item" :span="24" :md="6">
          <CardPanel
            class="instance-card"
            style="height: 100%"
            @click="toAppDetailPage(currentRemoteNode?.uuid || '', item.instanceUuid)"
          >
            <template #title>{{ item.config.nickname }}</template>
            <template #body>
              <a-typography-paragraph>
                <div>
                  {{ t("状态：") }}
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
                  {{ t("类型：") }}
                  {{ item.moreInfo?.instanceTypeText }}
                </div>
                <div>
                  {{ t("启动时间：") }}
                  {{ item.config.lastDatetime }}
                </div>
                <div>
                  {{ t("到期时间：") }}
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
</style>
