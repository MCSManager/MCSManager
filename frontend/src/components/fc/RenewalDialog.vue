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
    message.success(t("续费成功！"));
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
    :title="t('续费')"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <a-form layout="vertical">
        <a-typography-paragraph>
          {{ t("请确保激活码有效且对应此实例套餐规格。") }}
        </a-typography-paragraph>
        <a-form-item required>
          <a-input
            v-model:value="formData.code"
            :placeholder="t('请输入续费代码')"
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
            {{ t("确认续费") }}
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

.text-center {
  text-align: center;
}

.mt-20 {
  margin-top: 20px;
}

.flex {
  display: flex;
}

.justify-center {
  justify-content: center;
}

.gap-2 {
  gap: 8px;
}
</style>
