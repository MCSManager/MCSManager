<script setup lang="ts">
import { t } from "@/lang/i18n";
import { ExclamationCircleTwoTone } from "@ant-design/icons-vue";
</script>

<template>
  <div style="height: 100%">
    <ExclamationCircleTwoTone style="font-size: 70px" />
    <a-typography-title class="mt-24" :level="3">
      {{ t("当前地址不存在网页") }}
    </a-typography-title>
  </div>
</template>
