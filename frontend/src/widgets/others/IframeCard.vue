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
  urlSrc.value = (await openInputDialog(t("请输入Url链接"))) as string;
  setMetaValue("url", urlSrc.value);
};

const myIframe = ref<HTMLIFrameElement | null>(null);
const myIframeLoading = ref(false);

onMounted(() => {
  watch([urlSrc, myIframe], () => {
    myIframeLoading.value = true;
    if (myIframe.value) {
      myIframe.value.onload = () => {
        myIframeLoading.value = false;
      };
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
          class="ml-10"
          type="primary"
          size="small"
          v-if="urlSrc !== '' && containerState.isDesignMode"
          @click="editImgSrc()"
        >
          {{ t("编辑URL") }}</a-button
        >
      </template>

      <template #body>
        <a-skeleton
          active
          v-show="myIframeLoading"
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
            <span>{{ t("暂无网页") }}</span>
          </template>
          <a-button type="primary" @click="editImgSrc()">{{
            t("添加一个")
          }}</a-button>
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
