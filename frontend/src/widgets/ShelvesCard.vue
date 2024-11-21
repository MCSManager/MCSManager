<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { ShopInfo, ShopItem } from "@/services/apis/redeem";
import type { LayoutCard } from "@/types";
import { ref } from "vue";

defineProps<{
  card: LayoutCard;
}>();

const shopInfo = ref<ShopInfo>({
  uid: 1,
  nickname: "双羽的小店",
  username: "951092158@qq.com",
  lastTime: 1732007818032,
  introduction:
    "因为没有大家的支持，《原神》没有获得 2024TGA 中获得关键奖项。我们将于 12 月 11 日至 12 月 14 日，扣除大家账户上的 1600 的原石作为惩罚，感谢一路相伴！",
  afterSalesGroup: "QQ 群 951092158"
});

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
  <div class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <div class="container flex flex-between items-center">
      <div>
        <a-typography-title :level="3" class="mb-0">
          {{ shopInfo.nickname }}
        </a-typography-title>
      </div>
      <a-button type="primary">
        {{ t("使用兑换码") }}
      </a-button>
    </div>
    <div class="shop-item-container">
      <CardPanel
        v-if="shopInfo.introduction || shopInfo.afterSalesGroup"
        class="shelves-card-container"
        :full-height="false"
      >
        <template #body>
          <a-typography-paragraph>
            <a-typography-text v-if="shopInfo.introduction">
              {{ shopInfo.introduction }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-typography-paragraph>
            <a-typography-text v-if="shopInfo.afterSalesGroup">
              <span>售后渠道：</span>
              <a-tag>{{ shopInfo.afterSalesGroup }}</a-tag>
            </a-typography-text>
          </a-typography-paragraph>
        </template>
      </CardPanel>

      <CardPanel
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
      </CardPanel>
    </div>
  </div>
</template>

<style lang="less" scoped>
.shop-item-container {
  padding: 4px;
  overflow-y: auto;
  text-align: left;
  color: var(--color-gray-13);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-wrapper {
  padding: 4px;
  overflow-y: auto;
  text-align: left;
  color: var(--color-gray-13);
  display: flex;
  flex-direction: column;
  gap: 24px;

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
  }
}

.shelves-card-container {
  width: 100%;
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
