<script setup lang="ts">
import type { LayoutCard } from "@/types";

const props = defineProps<{
  card: LayoutCard;
}>();
</script>

<template>
  <div class="">
    <a-typography-title class="mb-0" :level="4">
      {{ props.card.title }}
    </a-typography-title>
  </div>
</template>
