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

const props = defineProps<{
  card: LayoutCard;
}>();

const operationForm = ref({
  name: ""
});

const { state } = useOverviewInfo();

const detailList = (node: ComputedNodeInfo) => {
  return [
    {
      title: t("连接地址"),
      value: `${node.ip}:${node.port}`
    },
    {
      title: t("内存"),
      value: node.memText
    },
    {
      title: t("CPU"),
      value: node.cpuInfo
    },
    {
      title: t("实例状态"),
      value: node.instanceStatus
    },
    {
      title: t("在线状态"),
      value: node.available ? t("在线") : t("离线")
    },
    {
      title: t("平台"),
      value: node.platformText
    },
    {
      title: t("版本"),
      value: node.version
    }
  ];
};

const nodeOperations = [
  {
    title: t("文件管理"),
    icon: FolderOpenOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("终端"),
    icon: CodeOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("镜像管理"),
    icon: BlockOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("设置"),
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
            <a-button class="mr-12" type="primary">{{ t("新增节点") }}</a-button>
            <a-button>{{ t("使用手册") }}</a-button>
          </template>
          <template #center>
            <div class="search-input">
              <a-input v-model:value="operationForm.name" :placeholder="t('根据节点名字搜索')">
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
          {{
            t("远程节点上的应用程序的控制台，文件上传，文件下载都需要网页能够直接连接远程节点。")
          }}
          <br />
          {{
            t("因此必须避免使用除 localhost 外的局域网段任何 IP，必须使用外网 IP 或域名进行连接。")
          }}
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
              :cpu-data="item.cpuChartData"
              :mem-data="item.memChartData"
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
