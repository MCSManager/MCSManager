<script setup lang="ts">
import { useCardPool } from "@/stores/useCardPool";
import LayoutCardComponent from "@/components//LayoutCard.vue";
import { ref, computed } from "vue";
import { NEW_CARD_TYPE } from "@/types";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { useRoute } from "vue-router";
import Params from "./params.vue";
import { t } from "@/lang/i18n";
import { ROLE } from "@/config/router";
import type { NewCardItem } from "../../config/index";
import { reportErrorMsg } from "@/tools/validator";
import { AppstoreOutlined } from "@ant-design/icons-vue";

const { getCardPool } = useCardPool();
const { insertLayoutItem } = useLayoutConfigStore();
const { containerState } = useLayoutContainerStore();

const route = useRoute();

const display = computed(() => {
  cardPool = getCardPool()
    .filter((v) => (v.onlyPath ? v.onlyPath.includes(route.path) : true))
    .filter((v) => !v.disableAdd);
  return containerState.showNewCardDialog;
});

const paramsDialog = ref<InstanceType<typeof Params>>();

let cardPool = getCardPool();
const currentPageRole = route.meta.permission as ROLE;

const insertCardToLayout = async (card: NewCardItem) => {
  if (card.permission > currentPageRole) {
    return reportErrorMsg(t("TXT_CODE_fb4cb9cb"));
  }

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
    label: t("TXT_CODE_6e23c48"),
    value: NEW_CARD_TYPE.COMMON
  },
  {
    label: t("TXT_CODE_41406a5f"),
    value: NEW_CARD_TYPE.DATA
  },
  {
    label: t("TXT_CODE_d941eb89"),
    value: NEW_CARD_TYPE.INSTANCE
  },
  // {
  //   label: t("TXT_CODE_765d34e6"),
  //   value: NEW_CARD_TYPE.USER
  // },
  {
    label: t("TXT_CODE_76b2a495"),
    value: NEW_CARD_TYPE.OTHER
  }
];

const currentCardCategory = ref<NEW_CARD_TYPE>(NEW_CARD_TYPE.COMMON);
</script>

<template>
  <Transition name="global-action-float">
    <div v-if="display" class="new-card-list-container">
      <div class="new-card-list">
        <div class="mb-24">
          <a-radio-group v-model:value="currentCardCategory" size="large">
            <a-radio-button v-for="item in cardCategoryList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-radio-button>
          </a-radio-group>
          <a-button class="ml-8" @click="() => (containerState.showNewCardDialog = false)">
            {{ t("TXT_CODE_a7e9d4e") }}
          </a-button>
        </div>
        <div v-for="card in cardPool" :key="card.id + currentCardCategory">
          <a-row v-if="card.category === currentCardCategory" style="margin-bottom: 48px">
            <a-col span="24">
              <a-typography>
                <a-typography-title :level="4">
                  <AppstoreOutlined />
                  <span class="ml-4">
                    {{ card.title }}
                  </span>
                </a-typography-title>
                <a-typography-paragraph>
                  <div>
                    {{ t("TXT_CODE_8575f7c") }}
                    <a-tag v-if="card.permission >= ROLE.ADMIN" color="red">
                      {{ t("TXT_CODE_cd978243") }}
                    </a-tag>
                    <a-tag v-else-if="card.permission >= ROLE.USER" color="green">
                      {{ t("TXT_CODE_b67197fc") }}
                    </a-tag>
                    <a-tag v-else color="green">
                      {{ t("TXT_CODE_b488372f") }}
                    </a-tag>
                  </div>
                </a-typography-paragraph>
                <a-typography-paragraph>
                  <div>
                    {{ t("TXT_CODE_d486a561") }}
                    {{ card.description }}
                  </div>
                </a-typography-paragraph>
              </a-typography>
            </a-col>
            <a-col span="24" :md="24" :lg="card.width * 2">
              <div class="card-container-wrapper">
                <div v-if="card.permission > currentPageRole" class="card-alert">
                  <a-alert show-icon :message="t('TXT_CODE_cd8cd5d2')" type="warning" />
                </div>
                <LayoutCardComponent
                  :id="'card-card-container-' + card.id"
                  class="card-list-container"
                  :data-id="card.id"
                  :card="card"
                  :style="{ height: card.height }"
                  @click="() => insertCardToLayout(card)"
                />
              </div>
            </a-col>
          </a-row>
        </div>
      </div>
    </div>
  </Transition>

  <Params ref="paramsDialog" />
</template>

<style lang="scss" scoped>
@import "@/assets/global.scss";
.card-alert {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 20px;
  left: 20px;
  z-index: 999;
}
.new-card-list-tabs {
  z-index: 999;
  position: fixed;
  right: 24px;
  top: 24px;
  background-color: var(--new-card-list-background-color-menu);
  backdrop-filter: saturate(100%) blur(12px);
  padding: 16px 0px;
  border-radius: 6px;
  border: 1px dashed var(--gray-border-color);
}
.card-container-wrapper {
  border: 1px dashed var(--gray-border-color);
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}
.new-card-list-container {
  position: fixed;
  right: 0px;
  bottom: 0px;
  top: 60px;
  left: 0px;
  padding: 24px;

  background-color: var(--new-card-list-background-color);
  backdrop-filter: saturate(100%) blur(12px);
  z-index: 998;
  overflow-y: auto;

  .new-card-list {
    margin: auto;
    max-width: var(--app-max-width);
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
