<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import ProductCard from "@/components/ProductCard.vue";
import { t } from "@/lang/i18n";
import type { FrontProductInfo } from "@/services/apis/redeem";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { markdownToHTML } from "@/tools/safe";
import LoginCard from "@/widgets/LoginCard.vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import { Flex } from "ant-design-vue";
import { onMounted, onUnmounted, ref } from "vue";

interface Props {
  shopName?: string;
  shopDescription?: string;
  shopTip?: string;
  products?: FrontProductInfo[];
}

defineProps<Props>();
const emit = defineEmits<{
  toLogin: [];
  buy: [FrontProductInfo];
}>();

const { isLogged } = useAppStateStore();
const showLoginModal = ref(false);

const openLoginModal = () => {
  showLoginModal.value = true;
  document.body.style.overflow = "hidden";
};

const closeLoginModal = () => {
  showLoginModal.value = false;
  document.body.style.overflow = "";
};

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === "Escape" && showLoginModal.value) {
    closeLoginModal();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscape);
  document.body.style.overflow = "";
});
</script>

<!-- eslint-disable vue/no-v-html -->
<template>
  <Flex vertical :gap="40" justify="center" class="company-header">
    <Flex align="center" justify="space-between" :gap="16" style="flex: 1">
      <Flex class="mb-10" vertical align="start" justify="start" :gap="16">
        <a-typography-title :level="1" class="company-title">
          <div class="business-page-markdown-area" v-html="markdownToHTML(shopName || '')"></div>
        </a-typography-title>
        <a-typography-paragraph class="company-desc">
          <div
            class="business-page-markdown-area"
            v-html="markdownToHTML(shopDescription || '')"
          ></div>
        </a-typography-paragraph>

        <Flex :gap="16" align="center">
          <a-button
            v-if="!isLogged"
            type="primary"
            class="button-color-success"
            size="large"
            style="width: 120px"
            @click="openLoginModal"
          >
            {{ t("登录") }}
          </a-button>
          <a-button
            v-if="isLogged"
            type="primary"
            size="large"
            style="width: 120px"
            @click="emit('toLogin')"
          >
            {{ t("进入控制台") }}
          </a-button>
        </Flex>

        <div style="opacity: 0.4">
          <a-typography-paragraph style="text-align: left">
            <span v-html="markdownToHTML(shopTip || '')"></span>
          </a-typography-paragraph>
        </div>
      </Flex>
      <div class="products-container"></div>
    </Flex>
    <div>
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="product in products"
          :key="product.productId"
          :xs="24"
          :sm="12"
          :md="12"
          :lg="8"
          :xl="8"
        >
          <ProductCard :product="product" @buy="emit('buy', product)" />
        </a-col>
      </a-row>
    </div>
  </Flex>

  <!-- 自定义登录弹窗 -->
  <Transition name="modal-fade">
    <div v-if="showLoginModal" class="custom-modal-overlay" @click="closeLoginModal">
      <div class="custom-modal-container" @click.stop>
        <button class="custom-modal-close" @click="closeLoginModal">
          <CloseOutlined />
        </button>
        <div class="custom-modal-content">
          <LoginCard />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss">
@import "@/assets/global.scss";

.business-page-markdown-area {
  p {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
}
</style>

<style scoped lang="scss">
.down-icon-container {
  height: 60px;
}

/* Company header styles */
.company-header {
  text-align: left;
  min-height: 500px;
  margin: 0 40px;
}

.company-title {
  color: var(--color-blue-7);
  margin-bottom: 0 !important;
  font-weight: bold;
  font-size: 3.4rem !important;

  p {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
}

.company-desc {
  color: var(--color-gray-10) !important;
  font-size: 1.2rem;
  max-width: 700px;
  text-align: left;
}

/* Responsive design */
@media (max-width: 768px) {
  .company-title {
    font-size: 2rem !important;
  }

  .company-desc {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .company-header {
    padding: 40px 10px;
  }

  .company-title {
    font-size: 1.8rem !important;
  }
}

.products-container {
  max-height: 80vh;
  overflow-y: auto;
  width: 540px;
  padding: 0 20px;
}

/* 自定义弹窗样式 */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-mask-bg);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 0px;
}

.custom-modal-container {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: transparent;
  border-radius: 8px;
  animation: modalSlideIn 0.3s ease-out;
}

.custom-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--color-fill-3);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-1);
  font-size: 16px;
  transition: all 0.2s;
  z-index: 1001;

  &:hover {
    background: var(--color-fill-4);
    transform: rotate(90deg);
  }
}

.custom-modal-content {
  border-radius: 8px;
  overflow: hidden;
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .custom-modal-container {
  animation: modalSlideIn 0.3s ease-out;
}

.modal-fade-leave-active .custom-modal-container {
  animation: modalSlideOut 0.3s ease-in;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes modalSlideOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-50px);
    opacity: 0;
  }
}

/* 响应式弹窗 */
@media (max-width: 768px) {
  .custom-modal-container {
    max-width: 90vw;
  }

  .custom-modal-close {
    top: 10px;
    right: 10px;
    background: var(--color-fill-4);
  }
}
</style>
