<script setup lang="ts">
import ActionButton from "@/components/ActionButton.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { router } from "@/config/router";
import {
  BuildFilled,
  DropboxOutlined,
  DropboxSquareFilled,
  GoldFilled,
  SwitcherFilled,
  UserOutlined,
} from "@ant-design/icons-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const actions = [
  {
    icon: BuildFilled,
    title: t("建立 Minecraft 游戏服务器"),
    click: () => {
      router.push({
        path: "/quickstart",
        query: {
          type: "minecraft",
        },
      });
    },
  },
  {
    icon: SwitcherFilled,
    title: t("建立 Steam 游戏服务器"),
    click: () => {
      router.push({
        path: "/quickstart",
        query: {
          type: "steam",
        },
      });
    },
  },
  {
    icon: DropboxSquareFilled,
    title: t("部署任意控制台应用程序"),
    click: () => {
      router.push({
        path: "/quickstart",
        query: {
          type: "console",
        },
      });
    },
  },
];
</script>

<template>
  <card-panel style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-row :gutter="[0, 16]">
        <action-button
          v-for="(action, key) in actions"
          :key="action.title"
          :action="actions[key]"
        />
      </a-row>
    </template>
  </card-panel>
</template>
