<script setup lang="ts">
import { type FrontProductInfo } from "@/services/apis/redeem";
import { Button, Card, Flex } from "ant-design-vue";
import { useI18n } from "vue-i18n";

interface Props {
  product: FrontProductInfo;
}

interface Emits {
  (e: "buy", product: FrontProductInfo): void;
}

defineProps<Props>();
defineEmits<Emits>();

const { t } = useI18n();
</script>

<template>
  <Card
    class="product-card"
    :hoverable="true"
    :body-style="{
      height: '100%'
    }"
  >
    <Flex vertical justify="space-between" :gap="16" style="height: 100%">
      <!-- Product title -->
      <a-typography-title :level="3" class="product-title">
        {{ product.title }}
      </a-typography-title>

      <!-- Price -->
      <Flex align="baseline" :gap="8">
        <a-typography-title :level="2" class="product-price">
          {{ product.price }}
        </a-typography-title>
        <a-typography-text class="price-unit"> {{ t("/月") }} </a-typography-text>
      </Flex>

      <!-- Configuration info -->
      <Flex vertical :gap="8">
        <template v-for="item in product.lines" :key="item.title + item.value">
          <Flex justify="space-between">
            <a-typography-text class="spec-label"> {{ item.title }}: </a-typography-text>
            <a-typography-text class="spec-value">
              {{ item.value }}
            </a-typography-text>
          </Flex>
        </template>
      </Flex>

      <!-- Product remark -->
      <a-typography-paragraph class="product-remark">
        {{ product.remark }}
      </a-typography-paragraph>

      <!-- Buy button -->
      <Button type="primary" size="large" class="buy-button" @click="$emit('buy', product)">
        {{ t("立即购买") }}
      </Button>
    </Flex>
  </Card>
</template>

<style scoped lang="scss">
.product-card {
  width: 320px;
  border-radius: 12px;
  transition: all 0.3s ease;
  color: var(--color-gray-10);
  background-color: var(--color-gray-3) !important;
  border: 1px solid var(--color-gray-5) !important;
}

.product-card:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(64, 150, 255, 0.2);
}

.product-title {
  color: var(--color-gray-12);
  margin-bottom: 0 !important;
  font-size: 1.1rem !important;
}

.product-price {
  color: var(--color-red-6) !important;
  margin-bottom: 0 !important;
  font-size: 2.2rem !important;
}

.price-unit {
  opacity: 0.8;
  font-size: 1rem;
}

.spec-label {
  opacity: 0.8;
  font-size: 0.9rem;
}

.spec-value {
  font-weight: bold;
}

.product-remark {
  color: var(--color-gray-7) !important;
  font-size: 0.9rem;
  margin-bottom: 0 !important;
  line-height: 1.5;
}

.buy-button {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
}

/* Responsive design */
@media (max-width: 768px) {
  .product-card {
    width: 100%;
    max-width: 350px;
  }
}

@media (max-width: 480px) {
  .product-price {
    font-size: 1.6rem !important;
  }
}
</style>
