<script setup lang="ts">
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import { usePromiseDialog } from "@/hooks/useDialog";

const props = defineProps<MountComponent>();

const { isVisible, cancel, submit } = usePromiseDialog(props);
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    centered
    width="600px"
    :mask-closable="false"
    :title="t('TXT_CODE_708c10e2')"
    :ok-text="t('TXT_CODE_b1dedda3')"
    :footer="null"
    @ok="submit"
    @close="cancel"
  >
    <div class="dialog-overflow-container">As</div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
