<script setup lang="ts">
import { ref } from "vue";
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
const imgSrc = ref(getMetaValue("image", ""));
const { openInputDialog } = useAppToolsStore();

const editImgSrc = async () => {
  imgSrc.value = (await openInputDialog(t("请输入图片地址"))) as string;
  setMetaValue("image", imgSrc.value);
};
</script>

<template>
  <div style="width: 100%; position: relative">
    <div class="mask" v-if="imgSrc !== '' && containerState.isDesignMode">
      <a-button type="primary" @click="editImgSrc()">{{
        t("编辑图片")
      }}</a-button>
    </div>
    <img
      class="global-card-container-shadow"
      v-if="imgSrc !== ''"
      :src="imgSrc"
    />
    <CardPanel v-else style="height: 100%">
      <template #body>
        <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE">
          <template #description>
            <span>{{ t("暂无图片") }}</span>
          </template>
          <a-button type="primary" @click="editImgSrc()">{{
            t("添加一张")
          }}</a-button>
        </a-empty>
      </template>
    </CardPanel>
  </div>
</template>

<style scoped lang="scss">
img {
  border: 0;
  border-radius: 4px;
  width: 100%;
  box-shadow: 0 1px 2px 1px var(--card-shadow-color);
  height: 100%;
  object-fit: cover;
  aspect-ratio: 16/9;
}
.app-dark-theme {
  img {
    filter: brightness(0.7);
  }
}
.mask {
  position: absolute;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;

  button {
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    position: absolute;
    width: fit-content;
  }
}
</style>
