<script setup lang="ts">
import { t } from "@/lang/i18n";
import { Flex, Modal } from "ant-design-vue";
import { computed, onUnmounted, ref, watch } from "vue";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  instanceInfo: any;
}

const props = defineProps<Props>();
defineEmits<{
  "update:visible": [visible: boolean];
  close: [];
  toLogin: [];
}>();

// 倒计时相关
const countdown = ref(15);
const isCountdownActive = ref(false);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 监听弹窗打开，启动倒计时
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 弹窗打开时重置并启动倒计时
      countdown.value = 15;
      isCountdownActive.value = true;

      // 清除可能存在的旧定时器
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }

      // 启动倒计时
      countdownTimer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          isCountdownActive.value = false;
          if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
          }
        }
      }, 1000);
    } else {
      // 弹窗关闭时清除定时器
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      isCountdownActive.value = false;
      countdown.value = 15;
    }
  }
);

// 按钮文字
const buttonText = computed(() => {
  if (isCountdownActive.value) {
    return `${t("我知晓了")} (${countdown.value}s)`;
  }
  return t("我知晓了");
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});

// 账户信息表格数据源
const accountDataSource = computed(() => {
  if (!props.instanceInfo) return [];
  const data = [];

  if (props.instanceInfo.username) {
    data.push({
      key: "username",
      label: t("您的用户名"),
      value: props.instanceInfo.username,
      valueType: "text"
    });

    data.push({
      key: "password",
      label: t("您的密码"),
      value: props.instanceInfo.password || "与原账号密码保持一致",
      valueType: "text"
    });
  }

  if (props.instanceInfo.instance_info.name) {
    data.push({
      key: "name",
      label: t("激活的实例名称"),
      value: props.instanceInfo.instance_info.name,
      valueType: "text"
    });
  }

  if (props.instanceInfo.expire) {
    data.push({
      key: "expire",
      label: t("到期时间"),
      value: new Date(props.instanceInfo.expire).toLocaleString(),
      valueType: "text"
    });
  }

  return data;
});

// 配置信息表格数据源
const configDataSource = computed(() => {
  if (!props.instanceInfo?.instance_info?.lines?.length) return [];
  return props.instanceInfo.instance_info.lines.map((line: any, index: number) => ({
    key: `config_${index}`,
    label: line.title,
    value: line.value,
    valueType: "config"
  }));
});

// 端口信息表格数据源
const portsDataSource = computed(() => {
  if (!props.instanceInfo?.instance_info?.ports?.length) return [];
  return props.instanceInfo.instance_info.ports.map((port: any, index: number) => ({
    key: `port_${index}`,
    protocol: port.protocol.toUpperCase(),
    host: port.host,
    container: port.container
  }));
});

// 表格列定义
const infoColumns = [
  {
    title: t("项目"),
    dataIndex: "label",
    key: "label",
    width: "40%"
  },
  {
    title: t("内容"),
    dataIndex: "value",
    key: "value",
    width: "60%"
  }
];

const portsColumns = [
  {
    title: t("协议"),
    dataIndex: "protocol",
    key: "protocol",
    width: "30%"
  },
  {
    title: t("主机端口"),
    dataIndex: "host",
    key: "host",
    width: "35%"
  },
  {
    title: t("容器端口"),
    dataIndex: "container",
    key: "container",
    width: "35%"
  }
];
</script>

<template>
  <Modal
    :open="visible"
    :title="null"
    :footer="null"
    :closable="false"
    :mask-closable="false"
    :width="700"
    class="success-modal"
    :body-style="{ padding: '12px' }"
    @update:open="$emit('update:visible', $event)"
  >
    <Flex vertical :gap="24" class="success-modal-content">
      <!-- 成功状态区域 -->
      <Flex vertical align="center" :gap="16" class="success-header">
        <div class="success-status-circle">
          <div class="success-checkmark">✓</div>
        </div>
        <Flex vertical align="center" :gap="8">
          <a-typography-title :level="2" class="success-title">
            {{ title }}
          </a-typography-title>
          <a-typography-paragraph class="success-message">
            {{ message }}
          </a-typography-paragraph>
        </Flex>
      </Flex>

      <!-- 账户信息表格 -->
      <div v-if="accountDataSource.length > 0" class="info-section">
        <div class="section-title">
          <span>{{ t("账户信息") }}</span>
        </div>
        <a-table
          :columns="infoColumns"
          :data-source="accountDataSource"
          :pagination="false"
          :show-header="false"
          size="middle"
          class="info-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'value'">
              <a-typography-text :copyable="{ text: record.value }" class="value-text">
                {{ record.value }}
              </a-typography-text>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 配置信息表格 -->
      <div v-if="configDataSource.length > 0" class="info-section">
        <div class="section-title">
          <span>{{ t("配置信息") }}</span>
        </div>
        <a-table
          :columns="infoColumns"
          :data-source="configDataSource"
          :pagination="false"
          :show-header="false"
          size="middle"
          class="info-table config-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'value'">
              <a-typography-text :copyable="{ text: record.value }" class="value-text">
                <span class="config-value">{{ record.value }}</span>
              </a-typography-text>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 端口信息表格 -->
      <div v-if="portsDataSource.length > 0" class="info-section">
        <div class="section-title">
          <span>{{ t("端口信息") }}</span>
        </div>
        <a-table
          :columns="portsColumns"
          :data-source="portsDataSource"
          :pagination="false"
          :show-header="false"
          size="middle"
          class="info-table ports-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'protocol'">
              <a-typography-text :copyable="{ text: record.protocol }">
                <a-tag color="blue">{{ record.protocol }}</a-tag>
              </a-typography-text>
            </template>
            <template v-else-if="column.key === 'host'">
              <a-typography-text :copyable="{ text: record.host }">
                <a-tag color="volcano">{{ record.host }}</a-tag>
              </a-typography-text>
            </template>
            <template v-else-if="column.key === 'container'">
              <a-typography-text :copyable="{ text: record.container }">
                <a-tag color="magenta">{{ record.container }}</a-tag>
              </a-typography-text>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 操作按钮区域 -->
      <Flex justify="center" :gap="16" class="success-actions">
        <a-button size="large" type="primary" :disabled="isCountdownActive" @click="$emit('close')">
          {{ buttonText }}
        </a-button>
      </Flex>
    </Flex>
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
  max-width: 500px;
}

/* 信息区块 */
.info-section {
  text-align: left;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-12);
  padding: 0 4px;
}

.title-icon {
  font-size: 1.2rem;
  line-height: 1;
}

/* 表格样式 */
.info-table {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-gray-3);

  :deep(.ant-table-thead > tr > th) {
    background: var(--color-gray-2);
    color: var(--color-gray-11);
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid var(--color-gray-3);
    color: var(--color-gray-11);
  }

  :deep(.ant-table-tbody > tr:last-child > td) {
    border-bottom: none;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: var(--color-gray-1) !important;
  }
}

/* 表格内容样式 */
.value-text {
  color: var(--color-gray-12);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  :deep(.ant-typography-copy) {
    color: var(--color-primary);
    font-size: 0.9rem;
  }
}

.password-value,
.uuid-value {
  :deep(.ant-typography-copy) {
    margin-left: 4px;
  }
}

.value-tag {
  font-size: 0.875rem;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
}

.password-tag {
  font-family: "Courier New", Monaco, monospace;
  letter-spacing: 1px;
}

.uuid-tag {
  font-family: "Courier New", Monaco, monospace;
  font-size: 0.8rem;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

/* 配置信息表格特殊样式 */
.config-table {
  :deep(.ant-table-tbody > tr > td) {
    font-family: inherit;
  }
}

.config-value {
  font-family: "Courier New", Monaco, monospace;
  background: var(--color-gray-2);
  padding: 4px 10px;
  border-radius: 4px;
  color: var(--color-gray-12);
  font-weight: 500;
  font-size: 0.875rem;
  display: inline-block;
}

/* 端口信息表格 */
.ports-table {
  :deep(.ant-table-tbody > tr > td) {
    text-align: center;
  }

  :deep(.ant-table-thead > tr > th) {
    text-align: center;
  }

  .ant-typography {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

/* 操作按钮区域 */
.success-actions {
  padding-top: 8px;
}
</style>
