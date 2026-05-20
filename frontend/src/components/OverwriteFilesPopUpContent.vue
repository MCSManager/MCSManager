<script setup lang="ts">
import { t } from "@/lang/i18n";
import { computed } from "vue";

const props = defineProps<{
  count?: number;
  fileName: string;
  all: boolean;
  action: string;
}>();

const emit = defineEmits<{
  (e: "update:action", value: string): void;
  (e: "update:all", value: boolean): void;
}>();

const actionModel = computed({
  get: () => props.action,
  set: (v) => emit("update:action", v)
});

const allModel = computed({
  get: () => props.all,
  set: (v) => emit("update:all", v)
});
</script>

<template>
  <div class="overwrite-popup-content">
    <div class="mb-10">
      {{ t("TXT_CODE_58a55f17", { name: props.fileName }) }}
    </div>

    <a-radio-group v-model:value="actionModel" class="flex-col" style="gap: 8px">
      <a-radio value="rename">
        {{ t("TXT_CODE_c83551f5") }}
      </a-radio>

      <a-radio value="overwrite">
        {{ t("TXT_CODE_5bf41818") }}
      </a-radio>

      <a-radio value="skip">
        {{ t("TXT_CODE_518528d0") }}
      </a-radio>
    </a-radio-group>

    <div v-if="props.count && props.count > 1" class="mt-16">
      <a-checkbox v-model:checked="allModel">
        {{ t("TXT_CODE_5445f34b", { num: props.count - 1 }) }}
      </a-checkbox>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
