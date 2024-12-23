<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { useShopInfo } from "@/services/apis/redeem";
import { useAppStateStore } from "@/stores/useAppStateStore";
import Loading from "@/components/Loading.vue";

defineProps<{
  card: LayoutCard;
}>();

const { shopInfo, isLoading, isError } = useShopInfo();
const { isAdmin } = useAppStateStore();
</script>

<template>
  <CardPanel class="card-wrapper h-100 w-100" :style="{ maxHeight: card.height }">
    <template #title>
      {{ shopInfo?.nickname }}
    </template>
    <template #body>
      <div v-if="isLoading">
        <Loading />
      </div>
      <div v-if="shopInfo" class="shop-item-container">
        <div class="container flex flex-between mb-20" style="gap: 20px">
          <div>
            <a-typography-paragraph>
              <a-typography-text v-if="shopInfo.nickname" type="secondary">
                {{ shopInfo.introduction }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph>
              <a-typography-text v-if="shopInfo.afterSalesGroup">
                <span>{{ t("TXT_CODE_ef27fda1") }}</span>
                <a-tag>{{ shopInfo.afterSalesGroup }}</a-tag>
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph v-if="isAdmin">
              <a-typography-text>
                {{ t("TXT_CODE_ec0b25f5") }}
              </a-typography-text>
            </a-typography-paragraph>
          </div>
        </div>
      </div>

      <div v-if="isError" class="error-container">
        <div>
          <p>
            {{ t("TXT_CODE_e5bf0df1") }}
          </p>
          <p>
            {{ t("TXT_CODE_4ef3f800") }}
          </p>
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

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 24px;
  text-align: center;
}
</style>
