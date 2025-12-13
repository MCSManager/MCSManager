<script setup lang="ts">
import { t } from "@/lang/i18n";
import { requestBuyInstance } from "@/services/apis/redeem";
import { reportErrorMsg } from "@/tools/validator";

import type { MountComponent } from "@/types";
import { message } from "ant-design-vue";
import { ref } from "vue";

interface Props extends MountComponent {
  instanceId: string;
  daemonId: string;
  productId: number;
}

const props = defineProps<Props>();
const isVisible = ref(false);
const formData = ref({
  code: ""
});

const cancel = () => {
  isVisible.value = false;
  formData.value.code = "";
};

const { execute, isLoading } = requestBuyInstance();

const submit = async () => {
  try {
    await execute({
      data: {
        instanceId: props.instanceId,
        daemonId: props.daemonId,
        code: formData.value.code,
        productId: props.productId
      }
    });
    message.success(t("TXT_CODE_ae51f93b"));
    isVisible.value = false;
    formData.value.code = "";
  } catch (error) {
    reportErrorMsg(error);
  }
};

const openDialog = () => {
  isVisible.value = true;
  formData.value.code = "";
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    centered
    width="500px"
    :title="t('TXT_CODE_f77093c8')"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <a-form layout="vertical">
        <a-typography-paragraph>
          {{ t("TXT_CODE_2432f4cc") }}
        </a-typography-paragraph>
        <a-form-item required>
          <a-input
            v-model:value="formData.code"
            :placeholder="t('TXT_CODE_b3cc1379')"
            size="large"
            @keyup.enter="submit"
          />
        </a-form-item>

        <div class="text-center mt-20 flex justify-center gap-2">
          <a-button
            type="primary"
            :loading="isLoading"
            :disabled="!formData.code.trim()"
            @click="submit"
          >
            {{ t("TXT_CODE_bc560b9") }}
          </a-button>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.dialog-overflow-container {
  max-height: 60vh;
  overflow-y: auto;
}

.gap-2 {
  gap: 8px;
}
</style>
