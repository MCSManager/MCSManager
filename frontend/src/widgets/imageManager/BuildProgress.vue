<script setup lang="ts">
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import { reportErrorMsg } from "@/tools/validator";
import { buildProgress } from "@/services/apis/envImage";
import Loading from "@/components/Loading.vue";
const props = defineProps<{
  daemonId: string;
}>();

const screen = useScreen();
const isPhone = computed(() => screen.isPhone.value);
const open = ref(false);
const openDialog = async () => {
  open.value = true;
  await getProgress();
};

const progressList = ref<{ name: string; status: number }[]>([]);
const statusType: { [propsName: string]: string } = {
  "-1": t("TXT_CODE_20ce2aae"),
  "1": t("TXT_CODE_978da1c1"),
  "2": t("TXT_CODE_47e182a5")
};

const { execute, state, isLoading } = buildProgress();
const getProgress = async () => {
  progressList.value = [];
  try {
    await execute({
      params: {
        daemonId: props.daemonId
      }
    });
    if (state.value) {
      for (const k in state.value) {
        progressList.value.push({
          name: k,
          status: state.value[k]
        });
      }
    }
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :width="isPhone ? '100%' : 'calc(100% - 30vw)'"
    :title="t('TXT_CODE_4bbd3fde')"
  >
    <a-row v-if="!isLoading" :gutter="[24, 24]">
      <a-col v-for="i in progressList" :key="i.name + i.status" :span="24" :lg="6" :md="8" :sm="12">
        <CardPanel>
          <template #title>{{ i.name }}</template>
          <template #body>
            <a-typography-text>
              {{ statusType[i.status.toString()] }}
            </a-typography-text>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
    <a-row v-else :gutter="[24, 24]">
      <a-col :span="24">
        <Loading />
      </a-col>
    </a-row>
    <template #footer>
      <a-space>
        <a-button :loading="isLoading" @click="getProgress">{{ t("TXT_CODE_b76d94e0") }}</a-button>
        <a-button type="primary" @click="open = false">{{ t("TXT_CODE_b1dedda3") }}</a-button>
      </a-space>
    </template>
  </a-modal>
</template>
