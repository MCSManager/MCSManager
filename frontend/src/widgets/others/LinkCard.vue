<script setup lang="ts">
import { ref } from "vue";
import type { Ref } from "vue";
import ActionButton from "@/components/ActionButton.vue";
import { message } from "ant-design-vue";
import { DeleteOutlined } from "@ant-design/icons-vue";

import { $t as t } from "@/lang/i18n";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";

import type { LayoutCard } from "@/types/index";

interface LinkCardType {
  title: string;
  link: string;
}

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaValue, setMetaValue } = useLayoutCardTools(props.card);
const { containerState } = useLayoutContainerStore();

const cardData: Ref<LinkCardType[]> = ref(
  getMetaValue("linkCardData", [
    {
      title: t("示例链接"),
      link: "https://example.com/",
    },
  ]),
);

const addLink = ref({
  show: false,
  title: "",
  link: "",
  close: () => {
    addLink.value.title = "";
    addLink.value.link = "";
  },
  finish: () => {
    console.log("finish");
    if (addLink.value.title == "" || addLink.value.link == "")
      return message.error(t("请正确填写表单"));
    cardData.value.push({
      title: addLink.value.title,
      link: addLink.value.link,
    });
    setMetaValue("linkCardData", cardData.value);
    message.success(t("添加成功"));
    addLink.value.close();
    addLink.value.show = false;
  },
});

const openLink = (url: string) => {
  window.open(url, "_blank");
};

const deleteLink = (index: number) => {
  cardData.value.splice(index, 1);
};
</script>

<template>
  <card-panel>
    <template #title>
      <div class="flex">
        {{ card.title }}
        <div v-if="containerState.isDesignMode" class="btn-group ml-10">
          <a-button type="primary" size="small" @click="addLink.show = true">
            {{ t("添加") }}
          </a-button>
        </div>
      </div>
    </template>

    <template #body>
      <a-row :gutter="[0, 16]">
        <div class="h-100 w-100 button" v-for="(item, index) in cardData" :key="item.title">
          <a-popconfirm
            :title="t('你确定要删除这个超链接吗?')"
            :ok-text="t('确定')"
            :cancel-text="t('取消')"
            @confirm="deleteLink(index)"
          >
            <div class="delete-button" v-if="containerState.isDesignMode"><DeleteOutlined /></div>
          </a-popconfirm>
          <action-button :title="item.title" :click="() => openLink(item.link)" />
        </div>
      </a-row>
    </template>
  </card-panel>

  <a-modal
    v-model:open="addLink.show"
    :title="t('添加超链接')"
    @ok="addLink.finish()"
    @cancel="addLink.close()"
  >
    <a-textarea
      v-model:value="addLink.title"
      :placeholder="t('标题')"
      auto-size
      class="mt-10 mb-10"
    />
    <a-textarea v-model:value="addLink.link" :placeholder="t('链接地址')" auto-size />
  </a-modal>
</template>

<style scoped lang="scss">
.button {
  position: relative;
  .delete-button {
    cursor: pointer;
    z-index: 9;
    position: absolute;
    right: 15px;
    padding: 3px;
    top: calc(50% - 13px);
    scale: 1.2;
    transition: all 0.5s;

    &:hover {
      scale: 1.3;
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
