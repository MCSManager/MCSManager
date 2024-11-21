<script setup lang="ts">
import InnerCard from "@/components/InnerCard.vue";
import { t } from "@/lang/i18n";
import type { ShopItem } from "@/services/apis/redeem";
import type { LayoutCard } from "@/types";
import { ref } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const shopItems = ref<ShopItem[]>([
  {
    productId: 1,
    title: "测试服务器",
    price: 199,
    ispId: 1,
    daemonId: 5,
    payload: "",
    remark:
      "测试服务器测试服务器测试服务器测试服\n务器测试服务器测试服务器测试服务器测试服务器测s试服务器测试服务器测试服务器测试服务器测\n试服务器测试服务器测试服务器测试服务器测试服务器测试服务器测试服务器测试服务器测试服务器测试服务器测试服务器sdasdasd"
  },
  {
    productId: 7,
    title: "套餐2",
    price: 10,
    ispId: 1,
    daemonId: 5,
    payload: "",
    remark: "套餐2套餐2套餐2套餐2套餐2套餐2套餐2套餐2套餐2"
  },
  {
    productId: 7,
    title: "套餐2",
    price: 19,
    ispId: 1,
    daemonId: 5,
    payload: "",
    remark: "套餐2套餐2套餐2套餐2套餐2套餐2套餐2套餐2套餐2"
  },
  {
    productId: 7,
    title: "套餐2",
    price: 20,
    ispId: 1,
    daemonId: 5,
    payload: "",
    remark: "套餐2套餐2套餐2套餐2套餐2套餐2套餐2套餐2套餐2"
  },
  {
    productId: 15,
    title: "Localhost 主机套餐",
    price: 2222,
    ispId: 399,
    daemonId: 16,
    payload: "",
    remark: "ASZ扥as大赛as"
  }
]);
</script>

<template>
  <CardPanel class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <template #title>
      {{ card.title }}
    </template>
    <template #body>
      <div class="shop-item-container">
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
                    <div class="shelves-card-item-price-label">参考价</div>
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
