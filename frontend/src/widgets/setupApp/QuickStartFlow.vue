<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const formData = ref({
  language: "en_US",
});
</script>

<template>
  <CardPanel class="CardWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body> AAA </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.CardWrapper {
  min-height: 500px;
}
</style>
