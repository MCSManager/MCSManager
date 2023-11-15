<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { $t as t } from "@/lang/i18n";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { Empty } from "ant-design-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);

const { containerState } = useLayoutContainerStore();
const urlSrc = ref(getMetaValue("url", ""));
const { openInputDialog } = useAppToolsStore();

const editImgSrc = async () => {
  try {
    urlSrc.value = (await openInputDialog(t("TXT_CODE_45364559"))) as string;
    setMetaValue("url", urlSrc.value);
  } catch (error) {}
};

const myIframe = ref<HTMLIFrameElement | null>(null);
const myIframeLoading = ref(false);

onMounted(() => {
  watch([urlSrc, myIframe], () => {
    try {
      myIframeLoading.value = true;
      if (myIframe.value) {
        myIframe.value.onload = () => {
          myIframeLoading.value = false;
        };
      }
    } catch (error) {
      console.error(error);
    }
  });
});
</script>

<template>
  <div style="width: 100%; height: 100%; position: relative">
    <CardPanel v-if="urlSrc !== ''">
      <template #title>
        {{ card.title }}
        <a-button
          v-if="urlSrc !== '' && containerState.isDesignMode"
          class="ml-10"
          type="primary"
          size="small"
          @click="editImgSrc()"
        >
          {{ t("TXT_CODE_78930f0f") }}
        </a-button>
      </template>

      <template #body>
        <a-skeleton
          v-show="myIframeLoading"
          active
          :paragraph="{ rows: Number(card.height[0]) * 2 }"
        />
        <iframe
          v-show="!myIframeLoading"
          ref="myIframe"
          :src="urlSrc"
          :style="{ height: parseInt(card.height) + 'px', width: '100%' }"
          frameborder="0"
          marginwidth="0"
          marginheight="0"
        ></iframe>
      </template>
    </CardPanel>
    <CardPanel v-else style="height: 100%">
      <template #body>
        <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE">
          <template #description>
            <span>{{ t("TXT_CODE_6239c6b6") }}</span>
          </template>
          <a-button type="primary" @click="editImgSrc()">{{ t("TXT_CODE_dde54f31") }}</a-button>
        </a-empty>
      </template>
    </CardPanel>
  </div>
</template>

<style scoped lang="scss">
// iframe {
//   width: 100%;
// }
</style>
