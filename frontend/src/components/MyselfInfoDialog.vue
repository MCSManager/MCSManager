<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { reactive, toRaw } from "vue";
import { setUserApiKey } from "@/services/apis";
import { message } from "ant-design-vue";
const { state, updateUserInfo } = useAppStateStore();
const { state: tools } = useAppToolsStore();

const { execute, isLoading } = setUserApiKey();

const formState = reactive({
  resetPassword: false,
  oldPassword: "",
  password1: "",
  password2: ""
});

const handleGenerateApiKey = async (enable: boolean) => {
  const res = await execute({
    data: {
      enable
    }
  });

  if (res.value) {
    updateUserInfo();
    return message.success(t("更新成功"));
  }
};

const handleChangePassword = () => {};
const onSubmit = () => {
  console.log("submit!", toRaw(formState));
};
</script>

<template>
  <a-modal
    v-model:open="tools.showUserInfoDialog"
    centered
    :title="t('用户信息')"
    :footer="null"
    @ok="tools.showUserInfoDialog = false"
  >
    <div>
      <a-form :model="formState" layout="vertical">
        <a-row>
          <a-col :span="12">
            <a-form-item :label="t('用户名')">
              <span>{{ state.userInfo?.userName }}</span>
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item :label="t('权限等级')">
              <span>{{ state.userInfo?.permission }}</span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row>
          <a-col :span="12">
            <a-form-item :label="t('注册时间')">
              <span>{{ state.userInfo?.registerTime }}</span>
            </a-form-item>
          </a-col>
          <a-col>
            <a-form-item :label="t('最后登录')">
              <span>{{ state.userInfo?.registerTime }}</span>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item :label="t('用户ID')">
          <span>{{ state.userInfo?.uuid }}</span>
        </a-form-item>

        <a-form-item :label="t('密码')">
          <a-button
            v-if="!formState.resetPassword"
            size="default"
            danger
            @click="formState.resetPassword = true"
          >
            重置
          </a-button>
          <div v-if="formState.resetPassword">
            <a-input
              v-model:value="formState.oldPassword"
              size="default"
              class="mb-12"
              :placeholder="t('请输入旧密码')"
            />
            <a-input
              v-model:value="formState.password1"
              size="default"
              class="mb-12"
              :placeholder="t('请输入新密码')"
            />
            <a-input
              v-model:value="formState.password2"
              size="default"
              class="mb-12"
              :placeholder="t('请重复输入新密码')"
            />
            <div>
              <a-button size="default" @click="handleChangePassword">确定</a-button>
            </div>
          </div>
        </a-form-item>

        <a-form-item label="APIKEY">
          <a-typography-paragraph>
            {{
              t(
                "如果您需要通过第三方应用程序来访问面板，则需要使用此密钥进行身份校验，任何使用此密钥的请求都拥有此账号相同权限。"
              )
            }}
          </a-typography-paragraph>
          <a-typography-paragraph v-if="state.userInfo?.apiKey">
            <pre>{{ state.userInfo.apiKey }}</pre>
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            <pre>{{ t("未启用") }}</pre>
          </a-typography-paragraph>
          <a-button
            class="mr-10"
            size="default"
            :loading="isLoading"
            @click="handleGenerateApiKey(true)"
          >
            {{ t("生成") }}
          </a-button>
          <a-popconfirm
            v-if="state.userInfo?.apiKey"
            :title="t('你确定要关闭APIKey吗')"
            ok-text="Yes"
            cancel-text="No"
            @confirm="handleGenerateApiKey(false)"
          >
            <a-button size="default" danger> {{ t("关闭") }} </a-button>
          </a-popconfirm>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>
