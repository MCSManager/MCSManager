<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { SearchOutlined, UserOutlined } from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { router } from "@/config/router";
import { remoteInstances } from "@/services/apis";
import { remoteNodeList } from "../services/apis";

const props = defineProps<{
  card: LayoutCard;
}>();

const operationForm = ref({
  name: ""
});

const { execute: getNodes, state: nodes } = remoteNodeList();
const { execute: getInstances, state: instances } = remoteInstances();

onMounted(async () => {
  await getNodes();
  await getInstances({
    params: {
      remote_uuid: nodes.value?.[0].uuid ?? "",
      page: 1,
      page_size: 10,
      instance_name: ""
    }
  });
});

const toAppDetailPage = (daemonId: string, instanceId: string) => {
  router.push({
    path: `/instances/terminal`,
    query: {
      daemonId,
      instanceId
    }
  });
};
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button type="primary">{{ t("新建应用") }}</a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input v-model:value="operationForm.name" :placeholder="t('根据应用名字搜索')">
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>
      <a-col v-for="item in instances?.data" :key="item" :span="24" :md="6">
        <CardPanel style="height: 100%" @click="toAppDetailPage('11111', '2222')">
          <template #title>{{ item.config.nickname }}</template>
          <template #body>
            <a-typography-paragraph>
              <div>
                {{ t("状态：") }}
                {{ item.status }}
              </div>
              <div>
                {{ t("类型：") }}
                {{ item.config.type }}
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
</style>
