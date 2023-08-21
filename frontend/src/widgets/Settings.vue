<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { ref } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const formData = ref({
  language: "en_US"
});
</script>

<template>
  <CardPanel class="CardWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <!-- <div @click="click">{{ t2 }}, {{ t3 }}</div> -->

      <a-form :model="formData" layout="vertical">
        <a-form-item label="面板语言">
          <a-input v-model:value="formData.language" placeholder="input placeholder" />
        </a-form-item>
      </a-form>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped></style>
