<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { $t as t } from "@/lang/i18n";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import CardPanel from "@/components/CardPanel.vue";
import IconBtn from "@/components/IconBtn.vue";
import type { LayoutCard } from "@/types/index";
import { Empty } from "ant-design-vue";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons-vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { computed } from "vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);

const { containerState } = useLayoutContainerStore();
const urlSrc = ref(getMetaValue("url", ""));
const fullCard = computed(() => getMetaValue("full"));
const { openInputDialog } = useAppToolsStore();

const editImgSrc = async () => {
  try {
    urlSrc.value = (await openInputDialog(t("TXT_CODE_45364559"))) as string;
    setMetaValue("url", urlSrc.value);
  } catch (error: any) {}
};

const myIframe = ref<HTMLIFrameElement | null>(null);
const myIframeLoading = ref(false);

const toggleFullCard = () => {
  setMetaValue("full", !fullCard.value);
};

onMounted(() => {
  watch([urlSrc, myIframe], () => {
    try {
      myIframeLoading.value = true;
      if (myIframe.value) {
        myIframe.value.onload = () => {
          myIframeLoading.value = false;
        };
      }
    } catch (error: any) {
      console.error(error);
    }
  });
});
</script>

<template>
  <div style="width: 100%; height: 100%; position: relative">
    <CardPanel v-if="urlSrc !== ''" style="backdrop-filter: blur()">
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
      <template v-if="containerState.isDesignMode" #operator>
        <IconBtn
          :icon="fullCard ? FullscreenExitOutlined : FullscreenOutlined"
          :title="fullCard ? t('TXT_CODE_2818a7bc') : t('TXT_CODE_52ba5942')"
          @click="toggleFullCard"
        ></IconBtn>
      </template>

      <template #body>
        <a-skeleton
          v-show="myIframeLoading"
          active
          :paragraph="{ rows: parseInt(card.height[0]) * 2 }"
        />
        <iframe
          v-show="!myIframeLoading"
          ref="myIframe"
          :src="urlSrc"
          :style="{
            height: card.height,
            width: '100%',
            'z-index': containerState.isDesignMode ? -1 : 1
          }"
          :class="{ 'full-card-iframe': fullCard }"
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
.full-card-iframe {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  border-radius: 6px;
}
</style>
