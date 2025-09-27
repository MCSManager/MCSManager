<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface Props {
  title: string;
  instanceInfo: any;
  showInstanceDetails?: boolean;
}

defineProps<Props>();

const { t } = useI18n();
</script>

<template>
  <a-card v-if="instanceInfo" class="instance-info-card" :bordered="false">
    <template #title>
      <a-flex align="center" :gap="8">
        <span class="info-card-title">{{ title }}</span>
      </a-flex>
    </template>

    <a-flex vertical :gap="12">
      <!-- 基本账户信息 -->
      <template v-if="!showInstanceDetails">
        <a-flex
          v-if="instanceInfo.instance_id"
          justify="space-between"
          align="center"
          class="info-row"
        >
          <a-typography-text class="info-label">
            {{ t("实例ID") }}
          </a-typography-text>
          <a-tag color="blue" class="info-tag">
            {{ instanceInfo.instance_id }}
          </a-tag>
        </a-flex>

        <a-flex
          v-if="instanceInfo.username"
          justify="space-between"
          align="center"
          class="info-row"
        >
          <a-typography-text class="info-label">
            {{ t("用户名") }}
          </a-typography-text>
          <a-tag color="green" class="info-tag">
            {{ instanceInfo.username }}
          </a-tag>
        </a-flex>

        <a-flex
          v-if="instanceInfo.password"
          justify="space-between"
          align="center"
          class="info-row"
        >
          <a-typography-text class="info-label">
            {{ t("密码") }}
          </a-typography-text>
          <a-tag color="purple" class="info-tag password-tag">
            {{ instanceInfo.password }}
          </a-tag>
        </a-flex>

        <a-flex v-if="instanceInfo.uuid" justify="space-between" align="center" class="info-row">
          <a-typography-text class="info-label">
            {{ t("UUID") }}
          </a-typography-text>
          <a-tag color="cyan" class="info-tag uuid-tag">
            {{ instanceInfo.uuid }}
          </a-tag>
        </a-flex>

        <a-flex v-if="instanceInfo.expire" justify="space-between" align="center" class="info-row">
          <a-typography-text class="info-label">
            {{ t("到期时间") }}
          </a-typography-text>
          <a-tag color="orange" class="info-tag">
            {{ new Date(instanceInfo.expire).toLocaleDateString() }}
          </a-tag>
        </a-flex>
      </template>

      <!-- 实例详细信息 -->
      <template v-else-if="instanceInfo.instance_info">
        <a-flex
          v-if="instanceInfo.instance_info.name"
          justify="space-between"
          align="center"
          class="info-row"
        >
          <a-typography-text class="info-label">
            {{ t("实例名称") }}
          </a-typography-text>
          <a-tag color="geekblue" class="info-tag">
            {{ instanceInfo.instance_info.name }}
          </a-tag>
        </a-flex>

        <a-flex
          v-if="instanceInfo.instance_info.status !== undefined"
          justify="space-between"
          align="center"
          class="info-row"
        >
          <a-typography-text class="info-label">
            {{ t("运行状态") }}
          </a-typography-text>
          <a-tag
            :color="instanceInfo.instance_info.status === 0 ? 'red' : 'green'"
            class="info-tag"
          >
            {{ instanceInfo.instance_info.status === 0 ? t("已停止") : t("运行中") }}
          </a-tag>
        </a-flex>

        <!-- 配置信息 -->
        <template v-if="instanceInfo.instance_info.lines?.length">
          <a-divider class="info-divider">{{ t("配置信息") }}</a-divider>
          <a-flex
            v-for="line in instanceInfo.instance_info.lines"
            :key="line.title"
            justify="space-between"
            align="center"
            class="info-row config-row"
          >
            <a-typography-text class="info-label">
              {{ line.title }}
            </a-typography-text>
            <a-typography-text class="info-value config-value">
              {{ line.value }}
            </a-typography-text>
          </a-flex>
        </template>

        <!-- 端口信息 -->
        <template v-if="instanceInfo.instance_info.ports?.length">
          <a-divider class="info-divider">{{ t("端口信息") }}</a-divider>
          <a-flex vertical :gap="8">
            <a-flex
              v-for="(port, index) in instanceInfo.instance_info.ports"
              :key="index"
              justify="space-between"
              align="center"
              class="info-row port-row"
            >
              <a-typography-text class="info-label">
                {{ port.protocol.toUpperCase() }} {{ t("端口") }}
              </a-typography-text>
              <a-flex :gap="8" align="center">
                <a-tag color="volcano" class="port-tag"> {{ t("主机") }}: {{ port.host }} </a-tag>
                <a-tag color="magenta" class="port-tag">
                  {{ t("容器") }}: {{ port.container }}
                </a-tag>
              </a-flex>
            </a-flex>
          </a-flex>
        </template>
      </template>
    </a-flex>
  </a-card>
</template>

<style scoped lang="scss">
/* 实例信息卡片 */
.instance-info-card {
  background: var(--color-gray-1) !important;
  border: 1px solid var(--color-gray-3) !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  :deep(.ant-card-head) {
    border-bottom: 1px solid var(--color-gray-3) !important;
    padding: 16px 20px 12px !important;
    min-height: auto !important;
  }

  :deep(.ant-card-body) {
    padding: 16px 20px 20px !important;
  }
}

.info-card-title {
  color: var(--color-gray-12);
  font-weight: 600;
  font-size: 1rem;
}

.info-row {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-gray-2);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.info-label {
  color: var(--color-gray-8) !important;
  font-weight: 500;
  font-size: 0.9rem;
}

/* 特殊标签样式 */
.password-tag {
  font-family: "Courier New", monospace !important;
  letter-spacing: 1px !important;
}

.uuid-tag {
  font-family: "Courier New", monospace !important;
  font-size: 0.75rem !important;
  max-width: 200px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.port-tag {
  font-size: 0.8rem !important;
  padding: 2px 8px !important;
}

/* 分隔线样式 */
.info-divider {
  margin: 16px 0 8px 0 !important;

  :deep(.ant-divider-inner-text) {
    color: var(--color-gray-8) !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
  }
}

/* 配置信息行样式 */
.config-row {
  background: var(--color-gray-1);
  padding: 8px 12px !important;
  border-radius: 6px;
  border: 1px solid var(--color-gray-2);
}

.config-value {
  color: var(--color-gray-12) !important;
  font-weight: 600 !important;
  font-family: "Courier New", monospace;
  background: var(--color-gray-2);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* 端口信息行样式 */
.port-row {
  background: var(--color-gray-1);
  padding: 8px 12px !important;
  border-radius: 6px;
  border: 1px solid var(--color-gray-2);
}
</style>
