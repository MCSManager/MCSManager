<script setup lang="ts">
import BuyModal from "@/components/BuyModal.vue";
import ProductCard from "@/components/ProductCard.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import { useShop } from "@/hooks/useShop";
import { t } from "@/lang/i18n";
import type { FrontProductInfo } from "@/services/apis/redeem";
import { requestBuyInstance } from "@/services/apis/redeem";
import { reportErrorMsg } from "@/tools/validator";
import type { MountComponent } from "@/types";
import { message } from "ant-design-vue";
import { ref } from "vue";
import AppConfigProvider from "../AppConfigProvider.vue";

interface Props extends MountComponent {}

const props = defineProps<Props>();

const { products, fetchProducts, isLoading } = useShop();
const { execute: requestBuy } = requestBuyInstance();

// eslint-disable-next-line no-unused-vars
let resolve: (result: any) => void;
const open = ref(false);

// 购买对话框状态
const isBuyModalVisible = ref(false);
const selectedProduct = ref<FrontProductInfo | undefined>();

// 成功弹窗状态
const isSuccessModalVisible = ref(false);
const successInfo = ref({
  title: "",
  message: "",
  instanceInfo: null as any
});

// 显示购买对话框
const showBuyModal = (product: FrontProductInfo) => {
  selectedProduct.value = product;
  isBuyModalVisible.value = true;
};

// 处理购买确认
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
    isBuyModalVisible.value = false;

    // 显示成功弹窗
    successInfo.value = {
      title: t("TXT_CODE_fa9063e5"),
      message: t("TXT_CODE_864bf2ac"),
      instanceInfo: res.value
    };
    isSuccessModalVisible.value = true;

    message.success(t("TXT_CODE_fa9063e5"));
  } catch (error) {
    reportErrorMsg(error);
  }
};

// 取消购买
const handleBuyCancel = () => {
  isBuyModalVisible.value = false;
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

// 关闭主对话框
const cancel = async () => {
  open.value = false;
  resolve({ success: false });
  if (props.destroyComponent) props.destroyComponent(1000);
};

// 打开对话框
const openDialog = async () => {
  open.value = true;
  // 加载产品列表
  await fetchProducts();
  return new Promise<any>((_resolve) => {
    resolve = _resolve;
  });
};

defineExpose({ openDialog });
</script>

<template>
  <AppConfigProvider>
    <a-modal
      v-model:open="open"
      :title="t('TXT_CODE_566611d8')"
      :width="1200"
      :footer="null"
      centered
      @cancel="cancel"
    >
      <div class="dialog-overflow-container">
        <a-typography-paragraph>
          {{ t("TXT_CODE_8464c9b9") }}
        </a-typography-paragraph>
        <a-spin :spinning="isLoading">
          <div v-if="products && products.length > 0" class="products-container">
            <a-row :gutter="[16, 16]">
              <a-col
                v-for="product in products"
                :key="product.productId"
                :xs="24"
                :sm="12"
                :md="12"
                :lg="12"
              >
                <ProductCard :product="product" @buy="showBuyModal" />
              </a-col>
            </a-row>
          </div>
          <div v-else class="empty-container">
            <a-empty :description="t('TXT_CODE_6c79c420')" />
          </div>
        </a-spin>
      </div>
    </a-modal>

    <!-- 购买对话框 -->
    <BuyModal
      v-model:visible="isBuyModalVisible"
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
    />
  </AppConfigProvider>
</template>

<style lang="scss" scoped>
.dialog-overflow-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px 0;
}

.products-container {
  padding: 12px 0;
}

.empty-container {
  padding: 40px 0;
  text-align: center;
}
</style>
