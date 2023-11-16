<script setup lang="ts">
import { onMounted } from "vue";
import { t } from "@/lang/i18n";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useInstanceInfo } from "@/hooks/useInstance";
import { useAppRouters } from "@/hooks/useAppRouters";
import { parseTimestamp } from "@/tools/time";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { toPage } = useAppRouters();
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { statusText, isRunning, isStopped, instanceTypeText, instanceInfo } = useInstanceInfo({
  instanceId,
  daemonId,
  autoRefresh: true
});

const toTerminal = () => {
  toPage({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};

onMounted(() => {});
</script>

<template>
  <div style="width: 100%; position: relative">
    <CardPanel class="instance-card" @click="toTerminal()">
      <template #title>
        {{ instanceInfo?.config.nickname }}
      </template>
      <template #body>
        <a-typography-paragraph style="line-height: 26px">
          <div>
            {{ t("TXT_CODE_e70a8e24") }}
            <span v-if="isRunning" class="color-success">
              <CheckCircleOutlined />
              {{ statusText }}
            </span>
            <span v-else-if="isStopped" class="color-info">
              {{ statusText }}
            </span>
            <span v-else>
              <ExclamationCircleOutlined />
              {{ statusText }}
            </span>
          </div>
          <div>
            {{ t("TXT_CODE_68831be6") }}
            {{ instanceTypeText }}
          </div>
          <div>
            {{ t("TXT_CODE_d31a684c") }}
            {{ parseTimestamp(instanceInfo?.config.lastDatetime) }}
          </div>
          <div>
            {{ t("TXT_CODE_ae747cc0") }}
            {{ parseTimestamp(instanceInfo?.config.endTime) }}
          </div>
        </a-typography-paragraph>
      </template>
    </CardPanel>
  </div>
</template>

<style scoped lang="scss">
.instance-card {
  cursor: pointer;
  &:hover {
    border: 1px solid var(--color-gray-8);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}
</style>
