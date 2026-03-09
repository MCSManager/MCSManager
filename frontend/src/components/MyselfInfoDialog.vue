<script setup lang="ts">
import CopyButton from "@/components/CopyButton.vue";
import { PERMISSION_MAP } from "@/config/const";
import { t } from "@/lang/i18n";
import { confirm2FA, setUserApiKey, updatePassword } from "@/services/apis/user";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { reportErrorMsg } from "@/tools/validator";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import { reactive, ref } from "vue";
import { bind2FA } from "../services/apis/user";
const { state, updateUserInfo } = useAppStateStore();
const { state: tools } = useAppToolsStore();

const { execute, isLoading: setUserApiKeyLoading } = setUserApiKey();
const { execute: executeUpdatePassword, isLoading: updatePasswordLoading } = updatePassword();

const formState = reactive({
  resetPassword: false,
  TOTPCode: "",
  password1: "",
  password2: "",
  qrcode: ""
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
    if (formState.password1 !== formState.password2) return reportErrorMsg(t("TXT_CODE_d51f5d6"));
    if (formState.password1.length < 9 || formState.password1.length > 36)
      return reportErrorMsg(t("TXT_CODE_cc5a3aea"));
    try {
      await executeUpdatePassword({
        data: {
          passWord: formState.password1
        }
      });
      message.success(t("TXT_CODE_d3de39b4"));
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error: any) {
      return reportErrorMsg(error.message);
    }
  });
};

const handleBind2FA = async () => {
  const qrcode = await bind2FA().execute({
    data: {}
  });
  if (qrcode.value) {
    formState.qrcode = String(qrcode.value);
    await updateUserInfo();
  }
};

const confirm2FACode = async () => {
  const TOTPCode = formState.TOTPCode;
  try {
    await confirm2FA().execute({
      data: {
        enable: true,
        TOTPCode
      }
    });
  } catch {
    return message.error(t("TXT_CODE_3d68e43b"));
  }
  message.success(t("TXT_CODE_d3de39b4"));
  await updateUserInfo();
  formState.TOTPCode = "";
  formState.qrcode = "";
};

const disable2FACode = async () => {
  await confirm2FA().execute({
    data: {
      enable: false,
      TOTPCode: "000000"
    }
  });
  message.success(t("TXT_CODE_d3de39b4"));
  await updateUserInfo();
  formState.qrcode = "";
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
              <a-tag>{{ state.userInfo?.userName }}</a-tag>
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item :label="t('TXT_CODE_63ccbf90')">
              <a-tag>{{ PERMISSION_MAP[String(state.userInfo?.permission)] }}</a-tag>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :span="12">
            <a-form-item :label="t('TXT_CODE_c5c56801')">
              <a-tag>{{ state.userInfo?.registerTime }}</a-tag>
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item :label="t('TXT_CODE_d7ee9ba')">
              <a-tag>{{ state.userInfo?.loginTime }}</a-tag>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('TXT_CODE_1d9d0746')">
          <a-tag>{{ state.userInfo?.uuid }}</a-tag>
        </a-form-item>

        <a-form-item :label="t('TXT_CODE_551b0348')">
          <a-button v-if="!formState.resetPassword" danger @click="formState.resetPassword = true">
            {{ t("TXT_CODE_50d471b2") }}
          </a-button>
          <div v-if="formState.resetPassword">
            <a-input
              v-model:value="formState.password1"
              class="mb-12"
              :placeholder="t('TXT_CODE_4f6c39d3')"
            />
            <a-input
              v-model:value="formState.password2"
              class="mb-12"
              :placeholder="t('TXT_CODE_37924654')"
            />
            <div>
              <a-button :loading="updatePasswordLoading" @click="handleChangePassword">
                {{ t("TXT_CODE_d507abff") }}
              </a-button>
            </div>
          </div>
        </a-form-item>

        <a-form-item :label="t('TXT_CODE_61eae8a6')">
          <div v-if="!formState?.qrcode">
            <a-button class="mr-8" @click="handleBind2FA">
              {{ state.userInfo?.open2FA ? t("TXT_CODE_85a33a84") : t("TXT_CODE_a492ae63") }}
            </a-button>
            <a-button v-if="state.userInfo?.open2FA" danger @click="disable2FACode">
              {{ t("TXT_CODE_edd64e4d") }}
            </a-button>
          </div>
          <div v-if="formState?.qrcode">
            <p>
              1. {{ t("TXT_CODE_cc561947") }}<br />
              2. {{ t("TXT_CODE_fffce4a8") }}<br />
              3. {{ t("TXT_CODE_af2a6972") }}<br />
            </p>
            <div class="mb-20">
              <img :src="formState.qrcode" style="height: 180px; border-radius: 6px" />
            </div>
            <a-input
              v-model:value="formState.TOTPCode"
              class="mb-12"
              :placeholder="t('TXT_CODE_7ac8b1d3')"
            />
            <a-button :loading="setUserApiKeyLoading" @click="confirm2FACode">
              {{ t("TXT_CODE_b0a18c20") }}
            </a-button>
          </div>
        </a-form-item>
        <a-form-item label="APIKEY">
          <a-typography-paragraph>
            {{ t("TXT_CODE_b2dbf778") }}
          </a-typography-paragraph>
          <a-typography-paragraph v-if="state.userInfo?.apiKey">
            <pre
              class="flex flex-between align-center">{{ state.userInfo.apiKey }}<CopyButton size="small" type="text" :value="state.userInfo.apiKey" /></pre>
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            <pre>{{ t("TXT_CODE_d7dbc7c2") }}</pre>
          </a-typography-paragraph>
          <a-button
            class="mr-10"
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
            <a-button danger> {{ t("TXT_CODE_718c9310") }} </a-button>
          </a-popconfirm>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
