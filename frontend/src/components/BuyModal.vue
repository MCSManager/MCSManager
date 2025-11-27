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
        okText: `${t("确定")} (${countdown}s)`,
        okButtonProps: { disabled: true }
      });
    } else {
      modal.update({
        content: `${content}`,
        okText: t("确定"),
        okButtonProps: { disabled: false }
      });
    }
  };

  modal = Modal.confirm({
    title,
    content: `${content}`,
    okText: `${t("确定")} (${countdown}s)`,
    cancelText: t("取消"),
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
    const { execute } = queryUsername();
    const result = await execute({
      params: {
        username: username.value
      }
    });

    if (result.value?.uuid) {
      // 用户存在，显示确认框
      showConfirmWithCooldown(
        t("最终确认"),
        `${t("账号 {username} 已存在，是否是你自己的账号名？", { username: username.value })}`,
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
        t("最终确认"),
        `${t("此用户不存在，是否新建用户 {username}，并生成随机密码？", {
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
    reportErrorMsg(error.message || t("查询用户失败"));
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
    :title="t('购买服务')"
    :ok-text="t('确定')"
    :cancel-text="t('取消')"
    :confirm-loading="isChecking"
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
