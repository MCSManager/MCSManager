<script setup lang="ts">
import { t } from "@/lang/i18n";
import { type FrontProductInfo } from "@/services/apis/redeem";
import { queryUsername } from "@/services/apis/user";
import { reportErrorMsg } from "@/tools/validator";
import { Modal } from "ant-design-vue";
import { ref, watch } from "vue";

interface Props {
  visible: boolean;
  selectedProduct?: FrontProductInfo;
}

interface Emits {
  // eslint-disable-next-line no-unused-vars
  (_e: "update:visible", _visible: boolean): void;
  // eslint-disable-next-line no-unused-vars
  (_e: "confirm", _data: { cardCode: string; username: string }): void;
  // eslint-disable-next-line no-unused-vars
  (_e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cardCode = ref("");
const username = ref("");
const isChecking = ref(false);

// 表单验证规则
const formRules = {
  cardCode: [{ required: true, message: t("TXT_CODE_b9542334"), trigger: "blur" }],
  username: [{ required: true, message: t("TXT_CODE_578d5638"), trigger: "blur" }]
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

// 显示带冷却时间的确认框
const showConfirmWithCooldown = (
  title: string,
  content: string,
  onOk: () => void,
  onCancel?: () => void
) => {
  let countdown = 5;
  let okButtonDisabled = true;
  let modal: any;

  const updateContent = () => {
    if (countdown > 0) {
      modal.update({
        content: `${content}`,
        okText: `${t("TXT_CODE_d507abff")} (${countdown}s)`,
        okButtonProps: { disabled: true }
      });
    } else {
      modal.update({
        content: `${content}`,
        okText: t("TXT_CODE_d507abff"),
        okButtonProps: { disabled: false }
      });
    }
  };

  modal = Modal.confirm({
    title,
    content: `${content}`,
    okText: `${t("TXT_CODE_d507abff")} (${countdown}s)`,
    cancelText: t("TXT_CODE_a0451c97"),
    okButtonProps: { disabled: true },
    onOk: () => {
      if (!okButtonDisabled) {
        onOk();
      }
    },
    onCancel: () => {
      if (onCancel) onCancel();
    }
  });

  // 开始倒计时
  const timer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(timer);
      okButtonDisabled = false;
    }
    updateContent();
  }, 1000);
};

const handleConfirm = async () => {
  if (!cardCode.value.trim() || !username.value.trim()) {
    return;
  }

  // 检查用户名是否存在
  if (isChecking.value) return;

  try {
    isChecking.value = true;
    const result = await queryUsername().execute({
      params: {
        username: username.value
      }
    });

    if (result.value?.uuid) {
      // 用户存在，显示确认框
      showConfirmWithCooldown(
        t("TXT_CODE_2a3b0c17"),
        `${t("TXT_CODE_7982f9b6", { username: username.value })}`,
        () => {
          // 用户确认后，触发购买
          emit("confirm", {
            cardCode: cardCode.value,
            username: username.value
          });
        }
      );
    } else {
      // 用户不存在，显示创建确认框
      showConfirmWithCooldown(
        t("TXT_CODE_2a3b0c17"),
        `${t("TXT_CODE_a07b8694", {
          username: username.value
        })}`,
        () => {
          // 用户确认后，触发购买
          emit("confirm", {
            cardCode: cardCode.value,
            username: username.value
          });
        }
      );
    }
  } catch (error: any) {
    reportErrorMsg(error.message || t("TXT_CODE_f690e493"));
  } finally {
    isChecking.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <Modal
    :open="visible"
    :title="t('TXT_CODE_ce2c04e')"
    :ok-text="t('TXT_CODE_d507abff')"
    :cancel-text="t('TXT_CODE_a0451c97')"
    :confirm-loading="isChecking"
    @ok="handleConfirm"
    @cancel="handleCancel"
    @update:open="$emit('update:visible', $event)"
  >
    <a-form :model="{ cardCode, username }" :rules="formRules" layout="vertical">
      <a-form-item :label="t('TXT_CODE_e405b681')" name="username">
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_3ce4de75") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="username" :placeholder="t('TXT_CODE_2695488c')" size="large" />
      </a-form-item>

      <a-form-item :label="t('TXT_CODE_32d0b274')" name="cardCode">
        <a-input v-model:value="cardCode" :placeholder="t('TXT_CODE_ffda3755')" size="large" />
      </a-form-item>
    </a-form>
  </Modal>
</template>
