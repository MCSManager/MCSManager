<script setup lang="ts">
import { useCardPool } from "@/stores/useCardPool";
import LayoutCardComponent from "@/components//LayoutCard.vue";
import { ref, computed, type Ref } from "vue";
import { type LayoutCard, NEW_CARD_TYPE } from "@/types";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { useRoute } from "vue-router";
import Params from "./params.vue";
import CardPanel from "../CardPanel.vue";
import { t } from "@/lang/i18n";

const { getCardPool } = useCardPool();
const { insertLayoutItem } = useLayoutConfigStore();
const { containerState } = useLayoutContainerStore();

// 获取当前 router
const route = useRoute();

const display = computed(() => {
  cardPool = getCardPool()
    .filter((v) => (v.onlyPath ? v.onlyPath.includes(route.path) : true))
    .filter((v) => !v.disableAdd);
  return containerState.showNewCardDialog;
});

const paramsDialog = ref<InstanceType<typeof Params>>();

let cardPool = getCardPool();

const insertCardToLayout = async (card: LayoutCard) => {
  if (card.params) {
    const isParamsOk = await paramsDialog.value?.openDialog(card);
    if (!isParamsOk) return;
  }

  const newCard = JSON.parse(JSON.stringify(card));
  insertLayoutItem("", newCard);
  containerState.showNewCardDialog = false;
};

const cardCategoryList = [
  {
    label: t("通用卡片"),
    value: NEW_CARD_TYPE.COMMON,
  },
  {
    label: t("应用程序相关"),
    value: NEW_CARD_TYPE.INSTANCE,
  },
  {
    label: t("用户相关"),
    value: NEW_CARD_TYPE.USER,
  },
  {
    label: t("节点相关"),
    value: NEW_CARD_TYPE.NODE,
  },
  {
    label: t("其他"),
    value: NEW_CARD_TYPE.OTHER,
  },
];

const currentCardCategory = ref<NEW_CARD_TYPE>(NEW_CARD_TYPE.COMMON);

const handleTabClick = (value: string) => {
  if (value === "EXIT") {
    containerState.showNewCardDialog = false;
    currentCardCategory.value = NEW_CARD_TYPE.COMMON;
  }
};
</script>

<template>
  <Transition name="global-action-float">
    <div v-if="display" class="new-card-list-tabs">
      <a-tabs
        :tabBarGutter="0"
        size="small"
        v-model:activeKey="currentCardCategory"
        tab-position="right"
        animated
        @change="handleTabClick"
      >
        <a-tab-pane
          v-for="item in cardCategoryList"
          :key="item.value"
          :tab="item.label"
        ></a-tab-pane>

        <a-tab-pane
          key="EXIT"
          :tab="t('关闭')"
          @click="() => (containerState.showNewCardDialog = false)"
        >
        </a-tab-pane>
      </a-tabs>
    </div>
  </Transition>
  <Transition name="global-action-float">
    <div v-if="display" class="new-card-list-container">
      <div class="new-card-list">
        <div v-for="card in cardPool" :key="card.id + currentCardCategory">
          <a-row
            style="margin-bottom: 20px"
            v-if="card.category === currentCardCategory"
          >
            <a-col span="24">
              <a-typography>
                <a-typography-title :level="4">
                  <span class="global-text-white-border">
                    {{ card.title }}
                  </span>
                </a-typography-title>
                <a-typography-paragraph>
                  {{ card.description }}
                </a-typography-paragraph>
              </a-typography>
            </a-col>
            <a-col span="24" :md="24" :lg="card.width * 2">
              <div class="card-container-wrapper">
                <LayoutCardComponent
                  class="card-list-container"
                  :id="'card-card-container-' + card.id"
                  :data-id="card.id"
                  :card="card"
                  :style="{ height: card.height }"
                  @click="() => insertCardToLayout(card)"
                >
                </LayoutCardComponent>
              </div>
            </a-col>
          </a-row>
        </div>
      </div>
    </div>
  </Transition>

  <Params ref="paramsDialog"></Params>
</template>

<style lang="scss" scoped>
@import "@/assets/global.scss";
.new-card-list-tabs {
  z-index: 999;
  position: fixed;
  right: 24px;
  top: 24px;
  background-color: var(--new-card-list-background-color-menu);
  backdrop-filter: saturate(100%) blur(12px);
  padding: 16px 0px;
  border-radius: 4px;
  border: 1px dashed var(--gray-border-color);
}
.card-container-wrapper {
  border: 1px dashed var(--gray-border-color);
  border-radius: 4px;
  padding: 16px;
  overflow: auto;
}
.new-card-list-container {
  position: fixed;
  right: 0px;
  bottom: 0px;
  top: 0px;
  left: 0px;
  padding: 24px;

  background-color: var(--new-card-list-background-color);
  backdrop-filter: saturate(100%) blur(12px);
  z-index: 998;
  overflow-y: auto;

  .new-card-list {
    margin: auto;
    max-width: 1440px;
  }

  .card-list-container {
    cursor: pointer;
  }
  .card-list-container:hover {
    opacity: 0.8;

    transform: scale(1.02);
  }
}
</style>
