<script setup lang="ts">
import type { LayoutCard } from "@/types";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { onMounted } from "vue";
import { t } from "@/lang/i18n";
import { useInstanceInfo } from "@/hooks/useInstance";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { statusText, isRunning, isStopped, instanceTypeText, instanceInfo, execute } =
  useInstanceInfo({
    instanceId,
    daemonId,
    autoRefresh: true
  });

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      params: {
        uuid: instanceId,
        remote_uuid: daemonId
      }
    });
  }
});
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <a-typography-paragraph>
        {{ t("名称：") }}{{ instanceInfo?.config.nickname }}
      </a-typography-paragraph>
      <a-typography-paragraph> {{ t("类型：") }}{{ instanceTypeText }} </a-typography-paragraph>
      <a-typography-paragraph>
        <span>{{ t("状态：") }}</span>
        <span v-if="isRunning" class="color-success">
          <CheckCircleOutlined />
          {{ statusText }}
        </span>
        <span v-else-if="isStopped" class="color-info">
          <ExclamationCircleOutlined />
          {{ statusText }}
        </span>
        <span v-else>
          {{ statusText }}
        </span>
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("最后启动：") }}{{ instanceInfo?.config.lastDatetime }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("到期时间：") }}{{ instanceInfo?.config.endTime || "--" }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("创建时间：") }}{{ instanceInfo?.config.createDatetime }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        <span>{{ t("输出编码：") }}{{ instanceInfo?.config.oe.toUpperCase() }} </span>
        <span class="ml-6">{{ t("输入编码：") }}{{ instanceInfo?.config.ie.toUpperCase() }} </span>
      </a-typography-paragraph>
    </template>
  </CardPanel>
</template>
