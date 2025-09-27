<script setup lang="ts">
import { type FrontProductInfo } from "@/services/apis/redeem";
import { Modal } from "ant-design-vue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
  visible: boolean;
  selectedProduct?: FrontProductInfo;
}

interface Emits {
  (e: "update:visible", visible: boolean): void;
  (e: "confirm", data: { cardCode: string; username: string }): void;
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const cardCode = ref("");
const username = ref("");

// 表单验证规则
const formRules = {
  cardCode: [{ required: true, message: t("请输入卡密"), trigger: "blur" }],
  username: [{ required: true, message: t("请输入激活用户名"), trigger: "blur" }]
} as any;

// 监听visible变化，重置表单
watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      cardCode.value = "";
      username.value = "";
    }
  }
);

const handleConfirm = () => {
  if (!cardCode.value.trim() || !username.value.trim()) {
    return;
  }
  emit("confirm", {
    cardCode: cardCode.value,
    username: username.value
  });
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <Modal
    :open="visible"
    :title="t('购买服务')"
    :ok-text="t('确定')"
    :cancel-text="t('取消')"
    @ok="handleConfirm"
    @cancel="handleCancel"
    @update:open="$emit('update:visible', $event)"
  >
    <a-form :model="{ cardCode, username }" :rules="formRules" layout="vertical">
      <a-form-item :label="t('为哪个账号购买？')" name="username">
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("请确保输入的用户名正确，如果用户不存在则会自动创建，请勿使用他人账号购买。") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="username" :placeholder="t('请输入用户名')" size="large" />
      </a-form-item>

      <a-form-item :label="t('兑换码')" name="cardCode">
        <a-input v-model:value="cardCode" :placeholder="t('请输入兑换码')" size="large" />
      </a-form-item>
    </a-form>
  </Modal>
</template>
