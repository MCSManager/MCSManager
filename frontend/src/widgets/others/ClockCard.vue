<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { $t as t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { onMounted, onUnmounted, ref } from "vue";
import { UndoOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";
import { useLayoutCardTools } from "@/hooks/useCardTools";

import Style1 from "@/components/time/Style1.vue";
import Style2 from "@/components/time/Style2.vue";

const prop = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(prop.card);

const showStyle = ref(getMetaValue("style", 2));
const styleList = [Style1, Style2];
const maxStyle = styleList.length;

const changeStyle = () => {
  spin(1050);
  setMetaValue("style", (showStyle.value = showStyle.value === maxStyle ? 1 : showStyle.value + 1));
};

const isSpinning = ref(false);

let timekeeping: NodeJS.Timeout | null = null;
const spin = (time: number) => {
  isSpinning.value = true;
  if (timekeeping === null) {
    timekeeping = setTimeout(() => {
      isSpinning.value = false;
      timekeeping = null;
    }, time);
  }
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
      <template #operator-design>
        <a-button type="link" size="small" class="ml-10" @click="changeStyle()">
          <template #icon>
            <a-tooltip placement="top">
              <template #title>
                <span>{{ t("TXT_CODE_5ab1eb7d") }}</span>
              </template>
              <undo-outlined :rotate="45" :spin="isSpinning" />
            </a-tooltip>
          </template>
        </a-button>
      </template>
      <template #title>{{ card.title }}</template>
      <template #body>
        <component :is="styleList[showStyle - 1]" :date="date" :time="time" :card="card" />
      </template>
    </card-panel>
  </div>
</template>

<style lang="scss" scoped>
.value {
  font-weight: bolder;
}
</style>
