<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import { usePromiseDialog } from "@/hooks/useDialog";
import { useRedeem, type BuyInstanceResponse } from "@/services/apis/redeem";
import { type FormInstance } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";

const props = defineProps<MountComponent>();
const formRef = ref<FormInstance>();

const { isVisible, cancel, submit } = usePromiseDialog<BuyInstanceResponse>(props);

const { isLoading, buyInstance } = useRedeem();

const formData = ref({
  code: "",
  instanceId: "",
  username: ""
});

const instanceItem = ref<BuyInstanceResponse>();

const handleSubmit = async () => {
  await formRef.value!.validate();
  try {
    const res = await buyInstance(formData.value.username, formData.value.code);
    instanceItem.value = res;
  } catch (error) {
    reportErrorMsg(error);
  }
};
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    centered
    width="600px"
    :mask-closable="false"
    :title="t('兑换卡密')"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <template v-if="!instanceItem">
        <a-typography-paragraph>
          请输入供应方提供给您的兑换码以自动兑换相应的物品
        </a-typography-paragraph>
        <a-form ref="formRef" :model="formData" layout="vertical">
          <a-form-item
            name="username"
            label="用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          >
            <a-input
              v-model:value="formData.username"
              name="mcsm-redeem-username"
              placeholder="请填写你在此面板上的账号用户名，如果不存在则自动创建"
              autocomplete="off"
            />
          </a-form-item>
          <a-form-item
            name="code"
            label="兑换码"
            :rules="[{ required: true, message: '请输入兑换码' }]"
          >
            <a-input
              v-model:value="formData.code"
              name="mcsm-redeem-code"
              placeholder="请输入兑换码"
              autocomplete="off"
            />
          </a-form-item>
          <div class="mt-2 text-center">
            <a-typography-paragraph type="secondary">
              兑换码使用后即刻生效，与当前登录的账号绑定
            </a-typography-paragraph>
            <a-button class="w-28" type="primary" :loading="isLoading" @click="handleSubmit">
              确定
            </a-button>
          </div>
        </a-form>
      </template>

      <template v-else>
        <a-typography-paragraph>
          <div class="text-red-600">
            <InfoCircleOutlined />
            兑换成功，请牢记以下信息
          </div>
        </a-typography-paragraph>
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item label="用户名">
            <a-typography-text copyable :content="instanceItem?.username"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-if="instanceItem?.password" label="密码">
            <a-typography-text copyable :content="instanceItem?.password"></a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item v-else label="密码">
            <a-typography-text type="secondary">密码无更改</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="到期时间">
            {{ new Date(instanceItem?.expire ?? 0).toLocaleString() }}
          </a-descriptions-item>
        </a-descriptions>
        <div class="text-center mt-20 flex justify-center">
          <a-button type="primary" @click="submit(instanceItem)">我已记住以上消息</a-button>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
