<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";

defineProps<{
  card: LayoutCard;
}>();
const { state, isAdmin } = useAppStateStore();
const myAddr = `${window.location.href}`;
</script>

<template>
  <CardPanel class="CardWrapper h-100 w-100" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="h-100 w-100">
        <a-empty
          :image-style="{
            height: '140px'
          }"
        >
          <template #description>
            <div v-if="isAdmin" class="admin-text">
              <a-typography-paragraph>
                <p>
                  {{ t("1. 此页面所有人均可以访问，您也可以放置任何权限的卡片。") }}
                </p>
                <p>
                  {{ t("2. 访问者没有登录或者权限不足，依然会无法加载卡片。") }}
                </p>
                <p>
                  {{ t("3. 设计完成后，您可以使用已登录的状态直接访问。") }}
                </p>

                <pre>{{ myAddr }}</pre>
              </a-typography-paragraph>
            </div>
            <div v-else>
              <a-typography-paragraph>
                <p>
                  {{ t("此页面无内容。") }}
                </p>
              </a-typography-paragraph>
            </div>
          </template>
        </a-empty>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.admin-text {
  text-align: left;
  max-width: 420px;
  margin: 20px auto;
}
</style>
