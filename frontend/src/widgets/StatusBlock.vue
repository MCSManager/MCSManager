<script setup lang="ts">
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);

const type = getMetaValue<string>("type");

const subTitleMap: Record<string, string> = {
  node: "在线节点 / 总节点",
  instance: "正在运行数 / 全部实例总数",
  users: "登录失败次数 : 登录成功次数",
  system: "面板所在主机 CPU，RAM 百分比"
};

const subTitle = subTitleMap[type] || "";

const value = "10/11";
</script>

<template>
  <CardPanel class="StatusBlock" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-typography-text class="color-info">
        {{ subTitle }}
      </a-typography-text>

      <div class="value">{{ value }}</div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.StatusBlock {
  .value {
    font-weight: 800;
    font-size: 36px;
    margin-top: 4px;
  }
}
</style>
