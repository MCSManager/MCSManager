<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { useShopInfo } from "@/services/apis/redeem";
import { useMountComponent } from "@/hooks/useMountComponent";
import UseRedeemDialog from "@/components/fc/UseRedeemDialog.vue";
import { useAppStateStore } from "@/stores/useAppStateStore";
import PurchaseQueryDialog from "@/components/fc/PurchaseQueryDialog.vue";
defineProps<{
  card: LayoutCard;
}>();

const { shopInfo } = useShopInfo();
const { isAdmin } = useAppStateStore();

const openDialog = async () => {
  useMountComponent().mount(UseRedeemDialog);
};

const openPurchaseQueryDialog = async () => {
  useMountComponent().mount(PurchaseQueryDialog);
};
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
            <a-typography-paragraph v-if="isAdmin">
              <a-typography-text>
                {{ t("您可以将此页面地址复制通过互联网分享给用户，用户无需登录即可访问此页面。") }}
              </a-typography-text>
            </a-typography-paragraph>
          </div>
          <div style="text-align: right">
            <div>
              <a-button type="primary" @click="openDialog">
                {{ t("使用兑换码") }}
              </a-button>
            </div>
            <div class="mt-10">
              <a-button @click="openPurchaseQueryDialog">
                {{ t("购买历史查询") }}
              </a-button>
            </div>
          </div>
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
