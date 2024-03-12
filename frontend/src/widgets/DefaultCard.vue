<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import type { LayoutCard } from "@/types";

defineProps<{
  card: LayoutCard;
}>();
const { isAdmin } = useAppStateStore();
const myAddr = `${window.location.origin}/#/_open_page`;
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
                  {{ t("TXT_CODE_2c7bcdfa") }}
                </p>
                <p>
                  {{ t("TXT_CODE_da579edc") }}
                </p>
                <p>
                  {{ t("TXT_CODE_4d50f316") }}
                </p>

                <p>
                  {{ t("TXT_CODE_d324bb21") }}
                  <a :href="myAddr" target="_blank" rel="noopener noreferrer">{{ myAddr }}</a>
                </p>
              </a-typography-paragraph>
            </div>
            <div v-else>
              <a-typography-paragraph>
                <p>
                  {{ t("TXT_CODE_e15e5006") }}
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
