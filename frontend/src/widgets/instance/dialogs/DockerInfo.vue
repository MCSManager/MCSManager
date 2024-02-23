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
  <a-modal v-model:open="open" centered :title="t('TXT_CODE_a7f6b0e0')" @ok="open = false">
    <a-descriptions :column="{ md: 2, sm: 2, xs: 1 }">
      <a-descriptions-item :label="t('TXT_CODE_dd238854')">
        {{ props.dockerInfo?.memory }}MB
      </a-descriptions-item>
      <a-descriptions-item :label="t('TXT_CODE_efcef926')">
        {{ props.dockerInfo?.networkMode }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('TXT_CODE_77000411')">
        {{ props.dockerInfo?.image }}
      </a-descriptions-item>
      <a-descriptions-item :label="t('TXT_CODE_c3a3b6b1')">
        {{ props.dockerInfo?.containerName }}
      </a-descriptions-item>
      <a-descriptions-item v-if="props.dockerInfo?.ports" :label="t('TXT_CODE_d32301c1')">
        <div>
          <div
            v-for="(item, index) in dockerPortsArray(props?.dockerInfo.ports ?? [])"
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
      </a-descriptions-item>
    </a-descriptions>
  </a-modal>
</template>
