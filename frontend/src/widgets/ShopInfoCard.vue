<script setup lang="ts">
import InnerCard from "@/components/InnerCard.vue";
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
</script>

<template>
  <CardPanel class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <template #title>
      {{ shopInfo.nickname }}
    </template>
    <template #body>
      <div class="shop-item-container">
        <div class="container flex flex-between mb-20" style="gap: 40px">
          <div>
            <a-typography-paragraph>
              <a-typography-text v-if="shopInfo.nickname" type="secondary">
                {{ shopInfo.introduction }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph>
              <a-typography-text v-if="shopInfo.afterSalesGroup">
                <span>{{ t("售后渠道：") }}</span>
                <a-tag>{{ shopInfo.afterSalesGroup }}</a-tag>
              </a-typography-text>
            </a-typography-paragraph>
          </div>
          <a-button type="primary">
            {{ t("使用兑换码") }}
          </a-button>
        </div>
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
</style>
