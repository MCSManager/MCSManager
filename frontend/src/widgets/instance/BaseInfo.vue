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

instanceInfo.value?.config.type


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
        {{ t("TXT_CODE_7ec9c59c") }}{{ instanceInfo?.config.nickname }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_68831be6") }}{{ instanceTypeText }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        <span>{{ t("TXT_CODE_e70a8e24") }}</span>
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
        {{ t("TXT_CODE_46f575ae") }}{{ instanceInfo?.config.lastDatetime }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_ae747cc0") }}{{ instanceInfo?.config.endTime || "--" }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_8b8e08a6") }}{{ instanceInfo?.config.createDatetime }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("启动次数：") }}{{ instanceInfo?.started }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        <span>{{ t("TXT_CODE_cec321b4") }}{{ instanceInfo?.config.oe.toUpperCase() }} </span>
        <span class="ml-6">
          {{ t("TXT_CODE_400a4210") }}{{ instanceInfo?.config.ie.toUpperCase() }}
        </span>
      </a-typography-paragraph>
    </template>
  </CardPanel>
</template>
