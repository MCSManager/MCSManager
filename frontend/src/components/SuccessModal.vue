<script setup lang="ts">
import { Modal } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import InstanceInfoCard from "./InstanceInfoCard.vue";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  instanceInfo: any;
}

interface Emits {
  (e: "update:visible", visible: boolean): void;
  (e: "close"): void;
  (e: "toLogin"): void;
}

defineProps<Props>();
defineEmits<Emits>();

const { t } = useI18n();
</script>

<template>
  <Modal
    :open="visible"
    :title="null"
    :footer="null"
    :closable="false"
    :mask-closable="false"
    width="600px"
    class="success-modal"
    @update:open="$emit('update:visible', $event)"
  >
    <a-flex vertical :gap="24" class="success-modal-content">
      <!-- 成功状态区域 -->
      <a-flex vertical align="center" :gap="16" class="success-header">
        <div class="success-status-circle">
          <div class="success-checkmark">✓</div>
        </div>
        <a-flex vertical align="center" :gap="8">
          <a-typography-title :level="2" class="success-title">
            {{ title }}
          </a-typography-title>
          <a-typography-paragraph class="success-message">
            {{ message }}
          </a-typography-paragraph>
        </a-flex>
      </a-flex>

      <!-- 账户信息卡片 -->
      <InstanceInfoCard
        v-if="instanceInfo"
        :title="t('账户信息')"
        :instance-info="instanceInfo"
        :show-instance-details="false"
      />

      <!-- 实例详细信息卡片 -->
      <InstanceInfoCard
        v-if="instanceInfo?.instance_info"
        :title="t('实例详情')"
        :instance-info="instanceInfo"
        :show-instance-details="true"
      />

      <!-- 操作按钮区域 -->
      <a-flex justify="center" :gap="16" class="success-actions">
        <a-button size="large" @click="$emit('close')">
          {{ t("稍后处理") }}
        </a-button>
        <a-button type="primary" size="large" @click="$emit('toLogin')">
          {{ t("立即登录") }}
        </a-button>
      </a-flex>
    </a-flex>
  </Modal>
</template>

<style lang="scss">
/* 成功弹窗样式 */
.success-modal {
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .ant-modal-body {
    padding: 32px 24px;
  }
}
</style>

<style scoped lang="scss">
.success-modal-content {
  text-align: center;
}

/* 成功状态区域 */
.success-header {
  padding: 8px 0;
}

.success-status-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(82, 196, 26, 0.3);
  animation: successPulse 2s ease-in-out infinite;
}

.success-checkmark {
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
}

@keyframes successPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(82, 196, 26, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(82, 196, 26, 0.4);
  }
}

.success-title {
  color: var(--color-gray-12) !important;
  margin-bottom: 0 !important;
  font-weight: 600;
  font-size: 1.5rem !important;
}

.success-message {
  color: var(--color-gray-8) !important;
  font-size: 1rem;
  margin-bottom: 0 !important;
  line-height: 1.6;
  max-width: 400px;
}

/* 操作按钮区域 */
.success-actions {
  padding-top: 8px;
}
</style>
