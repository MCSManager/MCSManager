<script setup lang="ts">
// import { ref } from "vue";
// import { $t as t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types";

import { useOperationLog } from "@/hooks/useOperationLog";
import { onMounted } from "vue";

const { fetchData } = useOperationLog();

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
    <template #body> 11asdfasdf1 </template>
  </card-panel>
</template>
