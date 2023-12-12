<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";

import { t } from "@/lang/i18n";

const props = defineProps<MountComponent>();

const open = ref(true);

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  if (props.emitResult) props.emitResult("");
  await cancel();
};
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :title="t('命令助手')"
    :ok-text="t('确定')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    @ok="submit"
    @cancel="cancel"
  >
    <div>A</div>
  </a-modal>
</template>

<style lang="scss" scoped>
.instance-card {
  cursor: pointer;
}
.instance-card:hover {
  border: 1px solid var(--color-gray-8);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
}
</style>
