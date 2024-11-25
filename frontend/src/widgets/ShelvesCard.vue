<script setup lang="ts">
import InnerCard from "@/components/InnerCard.vue";
import { t } from "@/lang/i18n";
import { useShopInfo } from "@/services/apis/redeem";
import type { LayoutCard } from "@/types";

defineProps<{
  card: LayoutCard;
}>();

const { products: shopItems, isLoading, isError } = useShopInfo();

const reloadPage = () => {
  window.location.reload();
};
</script>

<template>
  <CardPanel class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <div v-if="isError" class="error-container">
        <a-result
          status="error"
          :title="t('无法获取商家信息')"
          :icon="null"
          :sub-title="isError.message"
        >
          <template #extra>
            <a-button type="primary" @click="reloadPage">
              {{ t("重新加载") }}
            </a-button>
          </template>
        </a-result>
      </div>
      <div v-if="isLoading">
        <Loading />
      </div>
      <div v-if="shopItems" class="shop-item-container">
        <InnerCard
          v-for="item in shopItems"
          :key="item.productId"
          class="shelves-card-container"
          :full-height="false"
        >
          <template #title>{{ item.title }}</template>
          <template #operator>
            <a-typography-text type="secondary" style="font-weight: 400">
              Product ID {{ item.productId }}
            </a-typography-text>
          </template>
          <template #body>
            <div class="">
              <div class="shelves-card-item">
                <div class="shelves-card-item-title">
                  <pre>{{ item.remark }}</pre>
                </div>
                <div class="shelves-card-item-price">
                  <div>
                    <div class="shelves-card-item-price-label">{{ t("参考价") }}</div>
                    <div>
                      <span class="price-text"> {{ item.price }} </span><span>/{{ t("月") }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </InnerCard>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="less" scoped>
.shop-item-container {
  overflow-y: auto;
  text-align: left;
  color: var(--color-gray-13);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.card-wrapper {
  pre {
    white-space: pre-wrap;
    font-family:
      ui-sans-serif,
      system-ui,
      sans-serif,
      "Apple Color Emoji",
      "Segoe UI Emoji",
      Segoe UI Symbol,
      "Noto Color Emoji";
    background: unset !important;
    border: unset !important;

    padding: 0 !important;
  }
}

.shelves-card-container {
  width: 100%;
  margin-bottom: 20px;
}

.shelves-card-item-title {
  margin-bottom: 12px;
}

.shelves-card-item-price {
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  text-align: right;

  .shelves-card-item-price-label {
    opacity: 0.6;
    font-size: 12px;
    text-align: right;
    margin-bottom: 4px;
  }
}

.price-text {
  color: var(--color-red-6);
  font-size: 20px;
}
</style>
