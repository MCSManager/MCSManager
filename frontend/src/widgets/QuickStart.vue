<script setup lang="ts">
import ActionButton from "@/components/ActionButton.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { router } from "@/config/router";
import { BuildFilled, DropboxSquareFilled, SwitcherFilled } from "@ant-design/icons-vue";
import { QUICKSTART_ACTION_TYPE } from "@/hooks/widgets/quickStartFlow";
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";

defineProps<{
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
          appType: QUICKSTART_ACTION_TYPE.Minecraft
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
          appType: QUICKSTART_ACTION_TYPE.SteamGameServer
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
          appType: QUICKSTART_ACTION_TYPE.AnyApp
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
      <a-row :gutter="[0, 12]">
        <fade-up-animation>
          <action-button
            v-for="(action, index) in actions"
            :key="action.title"
            :title="action.title"
            :click="actions[index].click"
            :icon="action.icon"
            :data-index="index"
          />
        </fade-up-animation>
      </a-row>
    </template>
  </card-panel>
</template>
