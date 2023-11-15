<script setup lang="ts">
import { t } from "@/lang/i18n";
import { ExclamationCircleTwoTone } from "@ant-design/icons-vue";
</script>

<template>
  <div style="height: 100%">
    <ExclamationCircleTwoTone style="font-size: 70px" />
    <a-typography-title class="mt-24" :level="3">
      {{ t("TXT_CODE_fd63a181") }}
    </a-typography-title>
  </div>
</template>
