<script setup lang="ts">
import { ref } from "vue";
import { t } from "@/lang/i18n";
import type { IGlobalInstanceDockerConfig } from "../../../../../common/global";
import { dockerPortsArray } from "@/tools/common";
const props = defineProps<{
  dockerInfo?: IGlobalInstanceDockerConfig;
}>();

const open = ref(false);
const openDialog = () => {
  open.value = true;
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal v-model:open="open" centered :title="t('容器资源限制信息')">
    <a-descriptions :column="{ md: 2, sm: 2, xs: 1 }">
      <a-descriptions-item :label="t('最大内存')">
        {{ props.dockerInfo?.memory }} MB
      </a-descriptions-item>
      <a-descriptions-item :label="t('网络模式')">
        {{ props.dockerInfo?.networkMode }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('镜像名')">
        {{ props.dockerInfo?.image }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('容器名')">
        {{ props.dockerInfo?.containerName }}
      </a-descriptions-item>
      <a-descriptions-item v-if="props.dockerInfo?.ports" :label="t('可用端口')">
        <div>
          <div
            v-for="(item, index) in dockerPortsArray(props?.dockerInfo.ports ?? [])"
            :key="index"
            style="margin-bottom: 2px"
          >
            <span>{{ t("主机") }}: {{ item.host }}</span>
            <span style="margin-left: 6px">{{ t("容器") }}: {{ item.container }}</span>
            <span style="margin-left: 8px">
              <a-tag color="green">{{ item.protocol }}</a-tag>
            </span>
          </div>
        </div>
      </a-descriptions-item>
    </a-descriptions>
  </a-modal>
</template>
