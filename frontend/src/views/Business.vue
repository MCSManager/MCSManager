<script setup lang="ts">
import { useShop } from "@/hooks/useShop";
import { Button, Card, Flex } from "ant-design-vue";
import { onMounted } from "vue";

const { products, companyInfo, fetchProducts } = useShop();

onMounted(async () => {
  await fetchProducts();
});
</script>

<template>
  <Flex vertical :gap="60" class="business-container">
    <!-- 公司信息头部 -->
    <Flex class="company-header" align="center" justify="space-between" :gap="16">
      <Flex vertical align="start" justify="start" :gap="16">
        <a-typography-title :level="1" class="company-title">
          {{ companyInfo.name }}
        </a-typography-title>
        <a-typography-paragraph class="company-desc">
          {{ companyInfo.description }}
        </a-typography-paragraph>
        <a-typography-paragraph>
          <a-typography-text> 联系方式：{{ companyInfo.contact.email }} </a-typography-text>
        </a-typography-paragraph>
      </Flex>
      <div>
        <!-- TODO 登录界面 -->
        AAA
      </div>
    </Flex>

    <!-- 产品展示区域 -->
    <div class="products-section">
      <Flex vertical :gap="32">
        <a-typography-title :level="2" class="section-title"> 可用的服务套餐 </a-typography-title>

        <Flex wrap="wrap" :gap="24" justify="center">
          <Card
            v-for="product in products"
            :key="product.productId"
            class="product-card"
            :hoverable="true"
            :body-style="{
              height: '100%'
            }"
          >
            <Flex vertical justify="space-between" :gap="16" style="height: 100%">
              <!-- 产品标题 -->
              <a-typography-title :level="3" class="product-title">
                {{ product.title }}
              </a-typography-title>

              <!-- 价格 -->
              <Flex align="baseline" :gap="8">
                <a-typography-title :level="2" class="product-price">
                  ¥{{ product.price }}
                </a-typography-title>
                <a-typography-text class="price-unit"> /月 </a-typography-text>
              </Flex>

              <!-- 配置信息 -->
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

              <!-- 产品备注 -->
              <a-typography-paragraph class="product-remark">
                {{ product.remark }}
              </a-typography-paragraph>

              <!-- 购买按钮 -->
              <Button type="primary" size="large" class="buy-button"> 立即购买 </Button>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </div>

    <!-- 联系信息区域 -->
    <div class="contact-section">
      <Flex vertical :gap="24" align="center">
        <a-typography-title :level="2" class="section-title"> 联系我们 </a-typography-title>

        <Flex wrap="wrap" :gap="32" justify="center">
          <Flex vertical align="center" :gap="8">
            <a-typography-text class="contact-label"> 客服电话 </a-typography-text>
            <a-typography-title :level="4" class="contact-value">
              {{ companyInfo.contact.phone }}
            </a-typography-title>
          </Flex>

          <Flex vertical align="center" :gap="8">
            <a-typography-text class="contact-label"> 邮箱 </a-typography-text>
            <a-typography-title :level="4" class="contact-value">
              {{ companyInfo.contact.email }}
            </a-typography-title>
          </Flex>

          <Flex vertical align="center" :gap="8">
            <a-typography-text class="contact-label"> QQ客服 </a-typography-text>
            <a-typography-title :level="4" class="contact-value">
              {{ companyInfo.contact.qq }}
            </a-typography-title>
          </Flex>
        </Flex>
      </Flex>
    </div>
  </Flex>
</template>

<style scoped lang="scss">
.business-container {
  min-height: 100vh;
  padding: 40px 0px;
}

/* 公司头部样式 */
.company-header {
  padding: 0px 0px;
  text-align: center;
  height: 50vh;
  min-height: 300px;
}

.company-title {
  color: var(--color-primary);
  margin-bottom: 0 !important;
  font-weight: bold;
  font-size: 3.4rem !important;
}

.company-desc {
  color: var(--color-gray-8) !important;
  font-size: 1.2rem;
  max-width: 600px;
  text-align: left;
}

/* 产品区域样式 */
.products-section {
  padding: 0 0px;
}

.section-title {
  text-align: center;
  margin-bottom: 0 !important;
  font-weight: bold;
}

.product-card {
  width: 320px;
  color: var(--color-gray-10);
  background-color: var(--color-gray-2) !important;
  border: 1px solid var(--color-gray-5) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.product-card:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(64, 150, 255, 0.2);
}

.product-title {
  color: var(--color-gray-12);
  margin-bottom: 0 !important;
  font-size: 1.3rem !important;
}

.product-price {
  color: var(--color-primary) !important;
  margin-bottom: 0 !important;
  font-size: 2rem !important;
  font-weight: bold;
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

/* 联系区域样式 */
.contact-section {
  padding: 40px 20px;
  background-color: var(--color-gray-11);
  border-radius: 16px;
  margin: 0 20px;
}

.contact-label {
  color: var(--color-gray-7) !important;
  font-size: 0.9rem;
}

.contact-value {
  color: var(--color-primary) !important;
  margin-bottom: 0 !important;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .business-container {
    padding: 20px 10px;
    gap: 40px;
  }

  .company-title {
    font-size: 2rem !important;
  }

  .company-desc {
    font-size: 1rem;
  }

  .product-card {
    width: 100%;
    max-width: 350px;
  }

  .contact-section {
    margin: 0 10px;
  }
}

@media (max-width: 480px) {
  .company-header {
    padding: 40px 10px;
  }

  .company-title {
    font-size: 1.8rem !important;
  }

  .product-price {
    font-size: 1.6rem !important;
  }
}
</style>
