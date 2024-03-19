<script setup lang="ts">
import { ref } from "vue";
import type { LayoutCard } from "@/types";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { onMounted, computed } from "vue";
import { t } from "@/lang/i18n";
import { useInstanceInfo } from "@/hooks/useInstance";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { GLOBAL_INSTANCE_NAME } from "../../config/const";
import { parseTimestamp } from "../../tools/time";
import { dockerPortsArray } from "@/tools/common";
import DockerInfo from "./dialogs/DockerInfo.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const DockerInfoDialog = ref<InstanceType<typeof DockerInfo>>();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { statusText, isRunning, isStopped, instanceTypeText, instanceInfo, execute } =
  useInstanceInfo({
    instanceId,
    daemonId,
    autoRefresh: true
  });

const getInstanceName = computed(() => {
  if (instanceInfo.value?.config.nickname === GLOBAL_INSTANCE_NAME) {
    return t("TXT_CODE_5bdaf23d");
  } else {
    return instanceInfo.value?.config.nickname;
  }
});

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      params: {
        uuid: instanceId,
        daemonId: daemonId
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
        {{ t("TXT_CODE_7ec9c59c") }}{{ getInstanceName }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_68831be6") }}{{ instanceTypeText }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        <div style="display: flex; gap: 10px">
          <div>
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
          </div>
          <div>
            <span> {{ t("TXT_CODE_ad30f3c5") }}{{ instanceInfo?.started }} </span>
          </div>
        </div>
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_46f575ae") }}{{ parseTimestamp(instanceInfo?.config.lastDatetime) }}
      </a-typography-paragraph>
      <a-typography-paragraph v-if="instanceInfo?.config.processType === 'docker'">
        {{ t("TXT_CODE_4f917a65") }}
        <a href="javascript:;" @click="DockerInfoDialog?.openDialog()">
          {{ t("TXT_CODE_530f5951") }}
        </a>
      </a-typography-paragraph>
      <a-typography-paragraph
        v-if="
          instanceInfo?.config.processType === 'docker' &&
          Number(instanceInfo?.config.docker.ports?.length) > 0
        "
      >
        {{ t("TXT_CODE_2e4469f6") }}
        <div style="padding: 10px 0px 0px 16px">
          <div
            v-for="(item, index) in dockerPortsArray(instanceInfo?.config.docker.ports ?? [])"
            :key="index"
            style="margin-bottom: 2px"
          >
            <span>{{ t("TXT_CODE_8dfc41ef") }}: {{ item.host }}</span>
            <span style="margin-left: 6px">{{ t("TXT_CODE_8f8103b7") }}: {{ item.container }}</span>
            <span style="margin-left: 8px">
              <a-tag color="green">{{ item.protocol }}</a-tag>
            </span>
          </div>
        </div>
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_ae747cc0") }}{{ parseTimestamp(instanceInfo?.config.endTime) }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        {{ t("TXT_CODE_8b8e08a6") }}{{ parseTimestamp(instanceInfo?.config.createDatetime) }}
      </a-typography-paragraph>
      <a-typography-paragraph>
        <span>{{ t("TXT_CODE_cec321b4") }}{{ instanceInfo?.config.oe.toUpperCase() }} </span>
        <span class="ml-6">
          {{ t("TXT_CODE_400a4210") }}{{ instanceInfo?.config.ie.toUpperCase() }}
        </span>
      </a-typography-paragraph>
      <a-typography-paragraph>
        <a-typography-text> {{ t("TXT_CODE_30051f9b") }} </a-typography-text>
        <a-typography-text :copyable="{ text: instanceInfo?.instanceUuid }"> </a-typography-text>
        <a-typography-text class="ml-10"> {{ t("TXT_CODE_5f2d2e30") }} </a-typography-text>
        <a-typography-text :copyable="{ text: daemonId }"> </a-typography-text>
      </a-typography-paragraph>
    </template>
  </CardPanel>

  <DockerInfo ref="DockerInfoDialog" :docker-info="instanceInfo?.config.docker" />
</template>
