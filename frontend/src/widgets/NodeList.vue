<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref } from "vue";
import { t } from "@/lang/i18n";
import {
  ProfileOutlined,
  SearchOutlined,
  SettingOutlined,
  CodeOutlined,
  ClusterOutlined,
  BlockOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useOverviewInfo, type ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import IconBtn from "@/components/IconBtn.vue";
import NodeSimpleChart from "@/components/NodeSimpleChart.vue";

defineProps<{
  card: LayoutCard;
}>();

const operationForm = ref({
  name: ""
});

const { state } = useOverviewInfo();

const detailList = (node: ComputedNodeInfo) => {
  return [
    {
      title: t("TXT_CODE_f52079a0"),
      value: `${node.ip}:${node.port}`
    },
    {
      title: t("TXT_CODE_593ee330"),
      value: node.memText
    },
    {
      title: t("TXT_CODE_2c2712a4"),
      value: node.cpuInfo
    },
    {
      title: t("TXT_CODE_3d602459"),
      value: node.instanceStatus
    },
    {
      title: t("TXT_CODE_c9609785"),
      value: node.available ? t("TXT_CODE_823bfe63") : t("TXT_CODE_66ce073e")
    },
    {
      title: t("TXT_CODE_3d0885c0"),
      value: node.platformText
    },
    {
      title: t("TXT_CODE_81634069"),
      value: node.version
    }
  ];
};

const nodeOperations = [
  {
    title: t("TXT_CODE_ae533703"),
    icon: FolderOpenOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_524e3036"),
    icon: CodeOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_e6c30866"),
    icon: BlockOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_b5c7b82d"),
    icon: SettingOutlined,
    click: () => {
      console.log(3);
    }
  }
];
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              <ClusterOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button class="mr-12" type="primary">{{ t("TXT_CODE_15a381d5") }}</a-button>
            <a-button href="https://docs.mcsmanager.com/" target="_black">
              {{ t("TXT_CODE_3a302f23") }}
            </a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input v-model:value="operationForm.name" :placeholder="t('TXT_CODE_461d1a01')">
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_f9a92e38") }}
          <br />
          {{ t("TXT_CODE_a65c65c2") }}
        </a-typography-text>
      </a-col>

      <a-col v-for="item in state?.remote" :key="item.uuid" :span="24" :lg="12">
        <CardPanel style="height: 100%">
          <template #title>
            <ProfileOutlined />
            {{ item.remarks || item.ip }}
          </template>
          <template #operator>
            <span
              v-for="operation in nodeOperations"
              :key="operation.title"
              size="default"
              class="mr-2"
            >
              <IconBtn
                :icon="operation.icon"
                :title="operation.title"
                @click="operation.click"
              ></IconBtn>
            </span>
          </template>
          <template #body>
            <a-row :gutter="[24, 24]" class="mt-2">
              <a-col
                v-for="detail in detailList(item)"
                :key="detail.title + detail.value"
                :span="6"
              >
                <a-typography-paragraph>
                  <div>
                    {{ detail.title }}
                  </div>
                  <div>
                    {{ detail.value }}
                  </div>
                </a-typography-paragraph>
              </a-col>
            </a-row>
            <NodeSimpleChart
              class="mt-24"
              :cpu-data="item.cpuChartData ?? []"
              :mem-data="item.memChartData ?? []"
            ></NodeSimpleChart>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.search-input {
  transition: all 0.4s;
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
