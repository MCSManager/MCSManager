<!-- eslint-disable no-unused-vars -->
<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { $t as t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { onMounted, onUnmounted, ref, computed } from "vue";
import { UndoOutlined } from "@ant-design/icons-vue";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import dayjs from "dayjs";

import Style1 from "@/components/time/Style1.vue";
import Style2 from "@/components/time/Style2.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const maxStyle = 2;
const showStyle = ref(1);

const TimeComputed = computed(() => `Style${showStyle.value}`);

const changeStyle = () => {
  spin(1050);
  showStyle.value = showStyle.value === maxStyle ? 1 : showStyle.value + 1;
  console.log(showStyle.value, TimeComputed);
};

const { containerState } = useLayoutContainerStore();

const isSpinning = ref(false);

const spin = (time: number) => {
  isSpinning.value = true;
  setTimeout(() => {
    isSpinning.value = false;
  }, time);
};

const getTime = () => dayjs().format("HH:mm:ss");
const getDate = () => dayjs().format("YYYY/MM/DD dddd");

const time = ref(getTime());
const date = ref(getDate());

let timer: NodeJS.Timer | null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = getTime();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<template>
  <div class="h-100">
    <card-panel>
      <template #operator>
        <div v-if="containerState.isDesignMode" class="ml-10">
          <a-button type="link" size="small" @click="changeStyle()">
            <template #icon>
              <a-tooltip placement="top">
                <template #title>
                  <span>{{ t("更换样式") }}</span>
                </template>
                <undo-outlined :rotate="45" :spin="isSpinning" />
              </a-tooltip>
            </template>
          </a-button>
        </div>
      </template>
      <template #title>{{ card.title }}</template>
      <template #body>
        {{ TimeComputed }}
        <component :is="TimeComputed" :key="TimeComputed" :date="date" :time="time" :card="card" />
      </template>
    </card-panel>
  </div>
</template>

<style lang="scss" scoped>
.value {
  font-weight: bolder;
}
</style>
