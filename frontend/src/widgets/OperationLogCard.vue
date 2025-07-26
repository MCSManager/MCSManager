<script setup lang="ts">
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";

import { useOperationLog } from "@/hooks/useOperationLog";
import { onMounted } from "vue";
import dayjs from "dayjs";

const { fetchData, logsData } = useOperationLog();

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
      <div class="time-line full-card-body-container">
        <div v-if="logsData.length === 0" class="empty-state">
          <div class="empty-text">{{ t("TXT_CODE_54469e02") }}</div>
          <div class="empty-description">{{ t("TXT_CODE_73102f2b") }}</div>
        </div>
        <a-timeline v-else>
          <a-timeline-item v-for="(item, index) in logsData" :key="index" :color="item.color">
            <div v-for="subItem in item.item" :key="subItem.operation_id" class="log-item">
              <div class="log-content">
                {{ subItem.text }}
              </div>
              <div class="log-time">
                {{ dayjs(+subItem.operation_time).format("YYYY-MM-DD HH:mm:ss") }}
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
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.log-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 4px;
  word-break: break-word;
}

.log-time {
  font-size: 12px;
  color: #999;
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
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-description {
  font-size: 14px;
  color: #999;
  line-height: 1.4;
}
</style>
