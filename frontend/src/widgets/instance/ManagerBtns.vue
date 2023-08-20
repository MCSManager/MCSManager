<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { arrayFilter } from "../../tools/array";
import { t } from "@/lang/i18n";
import { ArrowRightOutlined, CloudServerOutlined } from "@ant-design/icons-vue";
import InnerCard from "@/components/InnerCard.vue";
import { LayoutCardHeight } from "../../config/originLayoutConfig";
import { router } from "@/config/router";
import { useAppRouters } from "@/hooks/useAppRouters";

const { toPage } = useAppRouters();

const props = defineProps<{
  card: LayoutCard;
}>();

const btns = arrayFilter([
  {
    title: t("服务端配置文件"),
    icon: CloudServerOutlined,
    click: () => {
      toPage({
        path: "/instances/terminal/serverConfig",
        query: {
          type: "Minecraft",
        },
      });
    },
  },
  {
    title: t("文件管理"),
    icon: CloudServerOutlined,
    click: () => {
      toPage({ path: "/instances/terminal/files" });
    },
  },
  {
    title: t("终端设置"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    },
  },
  {
    title: t("计划任务"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    },
  },
  {
    title: t("状态查询"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    },
  },
  {
    title: t("事件任务"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    },
  },

  {
    title: t("应用高级参数设置"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    },
  },
]);
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="pb-4">
        <a-row :gutter="[24, 24]" style="height: 100%">
          <a-col
            :span="24"
            :md="12"
            :lg="6"
            v-for="btn in btns"
            :key="btn.title"
            style="height: 100%"
          >
            <InnerCard
              :style="{ height: LayoutCardHeight.MINI }"
              @click="btn.click"
            >
              <template #title>
                <component :is="btn.icon"></component>
                {{ btn.title }}</template
              >
              <template #body>
                <a href="javascript:void(0);">
                  <span>
                    {{ t("前往") }}
                    <ArrowRightOutlined style="font-size: 12px" />
                  </span>
                </a>
              </template>
            </InnerCard>
          </a-col>
        </a-row>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.containerWrapper {
}
</style>
