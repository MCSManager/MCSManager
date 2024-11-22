<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { useShopInfo } from "@/services/apis/redeem";
defineProps<{
  card: LayoutCard;
}>();

const { shopInfo } = useShopInfo();
</script>

<template>
  <CardPanel class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <template #title>
      {{ shopInfo?.nickname }}
    </template>
    <template #body>
      <div v-if="shopInfo" class="shop-item-container">
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
