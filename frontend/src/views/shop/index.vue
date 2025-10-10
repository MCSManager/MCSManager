<script setup lang="ts">
import introductionImage2 from "@/assets/images/introduction-2.png";
import introductionImage3 from "@/assets/images/introduction-3.png";
import introductionImage5 from "@/assets/images/introduction-5.png";
import BuyModal from "@/components/BuyModal.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import { router } from "@/config/router";
import { useShop } from "@/hooks/useShop";
import { requestBuyInstance, type FrontProductInfo } from "@/services/apis/redeem";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { markdownToHTML } from "@/tools/safe";
import { reportErrorMsg } from "@/tools/validator";
import { Flex } from "ant-design-vue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import IndexHeader from "./header.vue";

const introductionImages = [
  // introductionImage1,
  introductionImage2,
  introductionImage3,
  // introductionImage4,
  introductionImage5
];

const { products, settingState: settings, refreshSettingInfo, fetchProducts } = useShop();
const { isAdmin } = useAppStateStore();
const { t } = useI18n();
const { execute: requestBuy } = requestBuyInstance();

const selectedProduct = ref<FrontProductInfo | undefined>();

// 对话框状态管理
const isModalVisible = ref(false);

// 成功弹窗状态管理
const isSuccessModalVisible = ref(false);
const successInfo = ref({
  title: "",
  message: "",
  instanceInfo: null as any
});

const toLoginPage = () => {
  router.push({ path: "/" });
};

const showBuyModal = (product?: FrontProductInfo) => {
  isModalVisible.value = true;
  selectedProduct.value = product;
};

const handleBuyConfirm = async (data: { cardCode: string; username: string }) => {
  try {
    const res = await requestBuy({
      data: {
        code: data.cardCode,
        daemonId: selectedProduct.value?.daemonId || "",
        productId: selectedProduct.value?.productId || 0,
        username: data.username
      }
    });

    // 关闭购买对话框
    isModalVisible.value = false;

    // 显示成功弹窗
    showSuccessModal({
      title: t("购买成功"),
      message: t("恭喜！您的服务已成功激活，可以登录控制台开始使用。"),
      instanceInfo: res.value
    });
  } catch (error) {
    reportErrorMsg(error);
  }
};

// 取消购买
const handleBuyCancel = () => {
  isModalVisible.value = false;
};

// 显示成功弹窗
const showSuccessModal = (info: { title: string; message: string; instanceInfo: any }) => {
  successInfo.value = info;
  isSuccessModalVisible.value = true;
};

// 关闭成功弹窗
const handleSuccessModalClose = () => {
  isSuccessModalVisible.value = false;
  successInfo.value = {
    title: "",
    message: "",
    instanceInfo: null
  };
};

// 成功后跳转到登录页
const handleSuccessToLogin = () => {
  handleSuccessModalClose();
  toLoginPage();
};

onMounted(async () => {
  await refreshSettingInfo();
  await fetchProducts();
});
</script>

<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div v-if="isAdmin">
      <ShopInfoUpdateDialog />
    </div>
    <Flex vertical :gap="0" class="business-container">
      <div class="section">
        <IndexHeader
          :shop-name="settings?.shopName"
          :shop-description="settings?.shopDescription"
          :shop-tip="settings?.shopTip"
          :products="products"
          @to-login="toLoginPage"
          @buy="showBuyModal"
        />
      </div>

      <div class="section">
        <Flex vertical :gap="32">
          <a-typography-paragraph class="section-title">
            <a-typography-title :level="1"> {{ $t("用户友好，易于使用") }} </a-typography-title>
            <a-typography-text class="section-sub-title" type="secondary">
              {{ $t("基于 MCSManager 面板提供可视化服务，快捷部署任意服务。") }}
            </a-typography-text>
          </a-typography-paragraph>

          <Flex justify="center" align="center" class="images-stack-container">
            <img
              :src="introductionImages[2]"
              style="max-width: 1100px; width: 100%; object-fit: cover"
            />
          </Flex>
        </Flex>
      </div>

      <footer class="footer-container">
        <Flex justify="space-between" align="center" vertical gap="8">
          <Flex align="center" :gap="8" justify="center" style="margin-bottom: 8px">
            <span>© Copyright {{ new Date().getFullYear() }}</span>
            <a-divider type="vertical" style="height: 9px" />
            <span v-html="markdownToHTML(settings?.loginInfo || '')"></span>
            <a-divider type="vertical" style="height: 9px" />
            <span v-html="markdownToHTML(settings?.shopEmail || '')"></span>
          </Flex>

          <div>
            <span>
              <span>Powered by </span>
              <a href="https://mcsmanager.com" target="_blank">MCSManager</a>
            </span>
          </div>

          <Flex v-if="isAdmin" justify="center" align="center" class="admin-message">
            {{
              $t(
                '右侧编辑悬浮球可以修改页面上的文字，如果您想深度定制此页，则需要开发人员修改 "frontend/src/views/Business.vue" 文件（仅管理员可见）'
              )
            }}
          </Flex>
        </Flex>
      </footer>
    </Flex>

    <!-- 购买对话框 -->
    <BuyModal
      v-model:visible="isModalVisible"
      :selected-product="selectedProduct"
      @confirm="handleBuyConfirm"
      @cancel="handleBuyCancel"
    />

    <!-- 激活成功弹窗 -->
    <SuccessModal
      v-model:visible="isSuccessModalVisible"
      :title="successInfo.title"
      :message="successInfo.message"
      :instance-info="successInfo.instanceInfo"
      @close="handleSuccessModalClose"
      @to-login="handleSuccessToLogin"
    />
  </div>
</template>

<style lang="scss">
.business-page-markdown-area,
.business-container {
  p {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
}
</style>

<style scoped lang="scss">
.layout-container {
  border-radius: 12px;
  padding: 20px 20px;
  overflow: hidden;
}

.business-container {
  p {
    margin-bottom: 0px !important;
    margin-top: 0px !important;
  }
}

.products-grid {
  padding: 40px 0;
}

.footer-container {
  color: #bbbbbb9d;
  padding: 40px;
  text-align: center;
  font-size: 13px;
  margin-top: 80px;

  a {
    color: #bbbbbb9d;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  a:hover {
    opacity: 0.6;
  }
}

.base-block {
  color: var(--color-gray-10);
  background-color: var(--color-gray-3) !important;
  border: 1px solid var(--color-gray-5) !important;
}

/* Products section styles */
.section {
  padding: 80px 0px;
}

.section-title {
  text-align: center;

  .section-title {
    margin-top: 20px;
  }
}

.login-input {
  width: 320px;
}

.login-button {
  width: 320px;
}

.admin-message {
  opacity: 0.6;
  padding: 8px 0px;
  text-align: center;
  font-size: 12px;
}

/* Responsive design */
@media (max-width: 768px) {
  .business-container {
    padding: 20px 10px;
    gap: 40px;
  }

  .contact-section {
    margin: 0 10px;
  }
}
</style>
