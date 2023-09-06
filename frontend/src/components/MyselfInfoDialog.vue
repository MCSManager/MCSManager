<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { reactive, ref } from "vue";
import { setUserApiKey, updatePassword } from "@/services/apis/user";
import { message } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue";
import CopyButton from "@/components/CopyButton.vue";
const { state, updateUserInfo } = useAppStateStore();
const { state: tools } = useAppToolsStore();

const { execute, isLoading: setUserApiKeyLoading } = setUserApiKey();
const { execute: executeUpdatePassword, isLoading: updatePasswordLoading } = updatePassword();

const formState = reactive({
  resetPassword: false,
  password1: "",
  password2: ""
});

const formRef = ref<FormInstance>();

const handleGenerateApiKey = async (enable: boolean) => {
  await execute({
    data: {
      enable
    },
    forceRequest: true,
    errorAlert: true
  });
  updateUserInfo();
  return message.success(t("TXT_CODE_d3de39b4"));
};

const handleChangePassword = async () => {
  formRef.value?.validateFields().then(async () => {
    if (formState.password1 !== formState.password2) return message.error(t("TXT_CODE_d51f5d6"));
    if (formState.password1.length < 6 || formState.password1.length > 36)
      return message.error(t("TXT_CODE_cc5a3aea"));
    try {
      await executeUpdatePassword({
        data: {
          passWord: formState.password1
        }
      });
      updateUserInfo();
      return message.success(t("TXT_CODE_d3de39b4"));
    } catch (error: any) {
      return message.error(error.message);
    }
  });
};
</script>

<template>
  <a-modal
    v-model:open="tools.showUserInfoDialog"
    centered
    :title="t('TXT_CODE_9bb2f08b')"
    :footer="null"
    @ok="tools.showUserInfoDialog = false"
  >
    <div>
      <a-form ref="formRef" :model="formState" layout="vertical">
        <a-row>
          <a-col :span="12">
            <a-form-item :label="t('TXT_CODE_eb9fcdad')">
              <span>{{ state.userInfo?.userName }}</span>
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item :label="t('TXT_CODE_63ccbf90')">
              <span>{{ state.userInfo?.permission }}</span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :span="12">
            <a-form-item :label="t('TXT_CODE_c5c56801')">
              <span>{{ state.userInfo?.registerTime }}</span>
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item :label="t('TXT_CODE_d7ee9ba')">
              <span>{{ state.userInfo?.registerTime }}</span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('TXT_CODE_1d9d0746')">
          <span>{{ state.userInfo?.uuid }}</span>
        </a-form-item>

        <a-form-item :label="t('TXT_CODE_551b0348')">
          <a-button
            v-if="!formState.resetPassword"
            size="default"
            danger
            @click="formState.resetPassword = true"
          >
            {{ t("TXT_CODE_50d471b2") }}
          </a-button>
          <div v-if="formState.resetPassword">
            <a-input
              v-model:value="formState.password1"
              size="default"
              class="mb-12"
              :placeholder="t('TXT_CODE_4f6c39d3')"
            />
            <a-input
              v-model:value="formState.password2"
              size="default"
              class="mb-12"
              :placeholder="t('TXT_CODE_37924654')"
            />
            <div>
              <a-button
                size="default"
                :loading="updatePasswordLoading"
                @click="handleChangePassword"
              >
                {{ t("TXT_CODE_d507abff") }}
              </a-button>
            </div>
          </div>
        </a-form-item>

        <a-form-item label="APIKEY">
          <a-typography-paragraph>
            {{ t("TXT_CODE_b2dbf778") }}
          </a-typography-paragraph>
          <a-typography-paragraph v-if="state.userInfo?.apiKey">
            <pre
              class="flex flex-between">{{ state.userInfo.apiKey }}<CopyButton size="small" type="text" :value="state.userInfo.apiKey" /></pre>
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            <pre>{{ t("TXT_CODE_d7dbc7c2") }}</pre>
          </a-typography-paragraph>
          <a-button
            class="mr-10"
            size="default"
            :loading="setUserApiKeyLoading"
            @click="handleGenerateApiKey(true)"
          >
            {{ t("TXT_CODE_d51cd7ae") }}
          </a-button>
          <a-popconfirm
            v-if="state.userInfo?.apiKey"
            :title="t('TXT_CODE_6819de18')"
            @confirm="handleGenerateApiKey(false)"
          >
            <a-button size="default" danger> {{ t("TXT_CODE_b1dedda3") }} </a-button>
          </a-popconfirm>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
