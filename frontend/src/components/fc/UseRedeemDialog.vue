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
        title: t("续费成功！"),
        content: t("新的到期时间：") + new Date(operateResult.value?.expire ?? 0).toLocaleString()
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
    :title="t('使用兑换码')"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <template v-if="!operateResult">
        <a-form ref="formRef" :model="formData" layout="vertical">
          <a-form-item
            v-if="!isRenewalMode"
            name="username"
            :label="t('账号用户名')"
            :rules="[{ required: true, message: t('请输入用户名') }]"
          >
            <a-input
              v-model:value="formData.username"
              name="mcsm-redeem-username"
              :placeholder="t('请填写你在此面板上的账号用户名，如果不存在则自动创建')"
              autocomplete="off"
            />
          </a-form-item>
          <a-form-item
            name="code"
            :label="t('实例兑换码')"
            :rules="[{ required: true, message: t('请输入兑换码') }]"
          >
            <a-input
              v-model:value="formData.code"
              name="mcsm-redeem-code"
              :placeholder="t('请输入兑换码，列如：2WJBUHJUD0VV5SYMC0F3HFFH')"
              autocomplete="off"
            />
          </a-form-item>
          <div class="text-center flex justify-center">
            <div>
              <a-typography-paragraph type="secondary">
                {{ t("兑换码使用后即刻生效，自动绑定到用户名一致的账号上") }}
              </a-typography-paragraph>
              <div class="flex justify-center">
                <a-button
                  class="w-28"
                  type="primary"
                  :loading="isLoading"
                  style="width: 100px"
                  @click="handleSubmit"
                >
                  {{ t("确定") }}
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
            <span v-if="!isRenewalMode">{{ t("兑换成功，请牢记以下信息") }}</span>
            <span v-else>{{ t("续费成功！") }}</span>
          </div>
        </a-typography-paragraph>
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item :label="t('用户名')">
            <a-typography-text copyable :content="operateResult?.username"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-if="operateResult?.password" :label="t('密码')">
            <a-typography-text copyable :content="operateResult?.password"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-else :label="t('密码')">
            <a-typography-text type="secondary">{{ t("密码无更改") }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-if="operateResult?.expire" :label="t('到期时间')">
            {{ new Date(operateResult.expire).toLocaleString() }}
          </a-descriptions-item>
        </a-descriptions>
        <div class="text-center mt-20 flex justify-center">
          <a-button type="primary" @click="submit(operateResult)">
            {{ t("我已记住以上信息") }}
          </a-button>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
