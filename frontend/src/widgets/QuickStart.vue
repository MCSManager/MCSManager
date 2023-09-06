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
  UserOutlined
} from "@ant-design/icons-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const actions = [
  {
    icon: BuildFilled,
    title: t("TXT_CODE_68128434"),
    click: () => {
      router.push({
        path: "/quickstart",
        query: {
          type: "minecraft"
        }
      });
    }
  },
  {
    icon: SwitcherFilled,
    title: t("TXT_CODE_46bb965"),
    click: () => {
      router.push({
        path: "/quickstart",
        query: {
          type: "steam"
        }
      });
    }
  },
  {
    icon: DropboxSquareFilled,
    title: t("TXT_CODE_2ab3e9fd"),
    click: () => {
      router.push({
        path: "/quickstart",
        query: {
          type: "console"
        }
      });
    }
  }
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
          :title="action.title"
          :action="actions[key].click"
        />
      </a-row>
    </template>
  </card-panel>
</template>
