<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import { usePromiseDialog } from "@/hooks/useDialog";
import { useRedeem, type PurchaseQueryResponse } from "@/services/apis/redeem";
import { type FormInstance } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";

interface Props extends MountComponent {
  instanceId?: string;
}
const props = defineProps<Props>();
const formRef = ref<FormInstance>();

const { isVisible, cancel } = usePromiseDialog<PurchaseQueryResponse>(props);
const { queryPurchase } = useRedeem();

const formData = ref({
  code: ""
});

const queryResult = ref<PurchaseQueryResponse>();

const handleSubmit = async () => {
  await formRef.value!.validate();
  try {
    queryResult.value = await queryPurchase(formData.value.code);
  } catch (error) {
    queryResult.value = undefined;
    reportErrorMsg(error);
  }
};
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    centered
    width="500px"
    :mask-closable="false"
    :title="t('TXT_CODE_2093cc1a')"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item
          name="code"
          :label="t('TXT_CODE_a3de630')"
          :rules="[{ required: true, message: t('TXT_CODE_ffda3755') }]"
        >
          <a-input
            v-model:value="formData.code"
            name="mcsm-redeem-code"
            :placeholder="t('TXT_CODE_ffda3755')"
            autocomplete="off"
          />
        </a-form-item>
        <div class="text-center mt-20 flex justify-center">
          <a-button type="primary" @click="handleSubmit">{{ t("TXT_CODE_ee8ae330") }}</a-button>
        </div>
      </a-form>

      <div v-if="queryResult" class="mt-20">
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item :label="t('TXT_CODE_f3209427')">
            <a-typography-text>
              <a :href="queryResult.panelAddr" target="_blank">{{ queryResult.panelAddr }}</a>
            </a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_eb9fcdad')">
            <a-typography-text copyable :content="queryResult?.username"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item :label="t('TXT_CODE_ec7553c6')">
            <a-typography-text
              v-if="queryResult?.password"
              copyable
              :content="queryResult?.password"
            ></a-typography-text>
            <a-typography-text v-else type="secondary">
              {{ t("TXT_CODE_cb61062d") }}
            </a-typography-text>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </div>
  </a-modal>
</template>
