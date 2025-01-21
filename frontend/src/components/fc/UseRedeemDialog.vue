<script setup lang="ts">
import { computed, ref } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import { usePromiseDialog } from "@/hooks/useDialog";
import { useRedeem, type BuyInstanceResponse } from "@/services/apis/redeem";
import { Modal, type FormInstance } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { useAppStateStore } from "@/stores/useAppStateStore";

interface Props extends MountComponent {
  instanceId?: string;
}
const props = defineProps<Props>();
const formRef = ref<FormInstance>();

const isRenewalMode = computed(() => !!props.instanceId);
const { state: appState } = useAppStateStore();

const { isVisible, cancel, submit } = usePromiseDialog<BuyInstanceResponse>(props);
const { isLoading, buyInstance, renewInstance } = useRedeem();

const formData = ref({
  code: "",
  username: appState.userInfo?.userName || ""
});

const operateResult = ref<BuyInstanceResponse>();

const handleSubmit = async () => {
  await formRef.value!.validate();
  try {
    if (!isRenewalMode.value) {
      const res = await buyInstance(formData.value.username, formData.value.code);
      operateResult.value = res;
    } else {
      const res = await renewInstance(
        formData.value.username,
        formData.value.code,
        props.instanceId!
      );
      operateResult.value = res;
      Modal.success({
        title: t("TXT_CODE_ae51f93b"),
        content:
          t("TXT_CODE_8074a178") + new Date(operateResult.value?.expire ?? 0).toLocaleString()
      });
      submit(operateResult.value);
    }
  } catch (error) {
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
    :title="t('TXT_CODE_75bf9192')"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <template v-if="!operateResult">
        <a-form ref="formRef" :model="formData" layout="vertical">
          <a-form-item
            v-if="!isRenewalMode"
            name="username"
            :label="t('TXT_CODE_c38813a8')"
            :rules="[{ required: true, message: t('TXT_CODE_2695488c') }]"
          >
            <a-typography-paragraph type="secondary">
              {{ t("TXT_CODE_b90e9abd") }}
            </a-typography-paragraph>
            <a-input
              v-model:value="formData.username"
              name="mcsm-redeem-username"
              :placeholder="t('TXT_CODE_8028e95b')"
              autocomplete="off"
            />
          </a-form-item>
          <a-form-item
            name="code"
            :label="t('TXT_CODE_fb87ccd')"
            :rules="[{ required: true, message: t('TXT_CODE_ffda3755') }]"
          >
            <a-input
              v-model:value="formData.code"
              name="mcsm-redeem-code"
              :placeholder="t('TXT_CODE_a95c0f85')"
              autocomplete="off"
            />
          </a-form-item>
          <div class="text-center flex justify-center">
            <div>
              <div class="flex justify-center">
                <a-button
                  class="w-28"
                  type="primary"
                  :loading="isLoading"
                  style="width: 100px"
                  @click="handleSubmit"
                >
                  {{ t("TXT_CODE_d507abff") }}
                </a-button>
              </div>
            </div>
          </div>
        </a-form>
      </template>

      <template v-else>
        <a-typography-paragraph>
          <div class="text-red-600">
            <InfoCircleOutlined />
            <span v-if="!isRenewalMode">{{ t("TXT_CODE_3ee20639") }}</span>
            <span v-else>{{ t("TXT_CODE_ae51f93b") }}</span>
          </div>
        </a-typography-paragraph>
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item :label="t('TXT_CODE_eb9fcdad')">
            <a-typography-text copyable :content="operateResult?.username"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-if="operateResult?.password" :label="t('TXT_CODE_551b0348')">
            <a-typography-text copyable :content="operateResult?.password"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-else :label="t('TXT_CODE_551b0348')">
            <a-typography-text type="secondary">{{ t("TXT_CODE_e1b0aab2") }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-if="operateResult?.expire" :label="t('TXT_CODE_fa920c0')">
            {{ new Date(operateResult.expire).toLocaleString() }}
          </a-descriptions-item>
        </a-descriptions>
        <div class="text-center mt-20 flex justify-center">
          <a-button type="primary" @click="submit(operateResult)">
            {{ t("TXT_CODE_a676f2da") }}
          </a-button>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
