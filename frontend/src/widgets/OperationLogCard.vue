<script setup lang="ts">
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";

import { useOperationLog } from "@/hooks/useOperationLog";
import { computed, onMounted } from "vue";
import dayjs from "dayjs";

const { fetchData, formattedLogs } = useOperationLog();

defineProps<{
  card: LayoutCard;
}>();

onMounted(() => {
  fetchData();
});
</script>

<template>
  <card-panel>
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <div class="time-line full-card-body-container scrollbar-hidden">
        <div v-if="formattedLogs.length === 0" class="empty-state">
          <div class="empty-text">{{ t("TXT_CODE_54469e02") }}</div>
          <div class="empty-description">{{ t("TXT_CODE_73102f2b") }}</div>
        </div>
        <a-timeline v-else>
          <a-timeline-item v-for="(item, index) in formattedLogs" :key="index" :color="item.color">
            <div class="log-item">
              <div class="log-content">{{ item.text }}</div>
              <div class="log-time">
                {{ dayjs(Number(item.operation_time)).format("YYYY-MM-DD HH:mm:ss") }}
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </template>
  </card-panel>
</template>

<style lang="scss" scoped>
.time-line {
  // fix the top content of the component is blocked
  padding-top: 10px;
}

.log-item {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--color-gray-4);
  border: 1px solid var(--card-border-color);
  transition: all 0.2s ease;

  &:hover {
    background: var(--card-shadow-extend-color);
    border-color: var(--card-border-color);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.log-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-10);
  margin-bottom: 4px;
  word-break: break-word;
}

.log-time {
  font-size: 12px;
  color: var(--color-gray-7);
  font-family: "Consolas", "Monaco", monospace;
  opacity: 0.8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 120px;
}

.empty-text {
  font-size: 16px;
  color: var(--color-gray-8);
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-description {
  font-size: 14px;
  color: var(--color-gray-7);
  line-height: 1.4;
}
</style>
