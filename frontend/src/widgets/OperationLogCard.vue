<script setup lang="ts">
// import { ref } from "vue";
// import { $t as t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";

import { useOperationLog } from "@/hooks/useOperationLog";
import { onMounted } from "vue";

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
        <a-timeline>
          <a-timeline-item v-for="(item, index) in logsData" :key="index" :color="item.color">
            <p v-for="subItem in item.item" :key="subItem.operation_id">
              {{ subItem.text }}
            </p>
          </a-timeline-item>
        </a-timeline>
      </div>
    </template>
  </card-panel>
</template>

<style lang="scss" scoped>
.time-line {
  padding-top: 5px;

  p {
    margin: 0;
  }
}
</style>
