<script setup lang="ts">
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import { useScreen } from "@/hooks/useScreen";
import { message } from "ant-design-vue";
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
  "-1": t("构建失败"),
  "1": t("正在构建"),
  "2": t("构建完成")
};

const { execute, state, isLoading } = buildProgress();
const getProgress = async () => {
  progressList.value = [];
  try {
    await execute({
      params: {
        remote_uuid: props.daemonId
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
    return message.error(err.message);
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
    :title="t('构建进度')"
  >
    <a-row v-if="!isLoading" :gutter="[24, 24]">
      <a-col v-for="i in progressList" :key="i" :span="24" :lg="6" :md="8" :sm="12">
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
        <a-button :loading="isLoading" @click="getProgress">刷新</a-button>
        <a-button type="primary" @click="open = false">关闭</a-button>
      </a-space>
    </template>
  </a-modal>
</template>
