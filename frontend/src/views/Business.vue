<script setup lang="ts">
import { router } from "@/config/router";
import { useShop } from "@/hooks/useShop";
import { requestBuyInstance, type FrontProductInfo } from "@/services/apis/redeem";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { markdownToHTML } from "@/tools/safe";
import { reportErrorMsg } from "@/tools/validator";
import { Button, Card, Flex, Modal } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

const { products, settingState: settings, refreshSettingInfo, fetchProducts } = useShop();
const { isAdmin } = useAppStateStore();
const { t } = useI18n();
const { execute: requestBuy } = requestBuyInstance();

const selectedProduct = ref<FrontProductInfo | undefined>();

// 表单验证规则
const formRules = {
  cardCode: [{ required: true, message: t("请输入卡密"), trigger: "blur" }],
  username: [{ required: true, message: t("请输入激活用户名"), trigger: "blur" }]
} as any;

const formData = reactive({
  code: ""
});

// 对话框状态管理
const isModalVisible = ref(false);
const cardCode = ref("");
const username = ref("");

// 成功弹窗状态管理
const isSuccessModalVisible = ref(false);
const successInfo = ref({
  title: "",
  message: "",
  instanceInfo: null as any
});

const toLoginPage = () => {
  router.push({ path: "/login" });
};

const activeInstance = async () => {
  if (!formData.code.trim()) {
    return;
  }

  try {
    const res = await requestBuy({
      data: {
        code: formData.code,
        daemonId: "",
        productId: 0,
        username: ""
      }
    });

    // 清空激活码输入框
    formData.code = "";

    // 显示成功弹窗
    showSuccessModal({
      title: t("激活成功"),
      message: t("恭喜！您的激活码已成功激活，可以登录控制台开始使用。"),
      instanceInfo: res.value
    });
  } catch (error) {
    reportErrorMsg(error);
  }
};

const showBuyModal = (product?: FrontProductInfo) => {
  isModalVisible.value = true;
  cardCode.value = "";
  username.value = "";
  selectedProduct.value = product;
};

const handleBuyConfirm = async () => {
  if (!cardCode.value.trim() || !username.value.trim()) {
    return;
  }
  try {
    const res = await requestBuy({
      data: {
        code: cardCode.value,
        daemonId: selectedProduct.value?.daemonId || "",
        productId: selectedProduct.value?.productId || 0,
        username: username.value
      }
    });

    // 关闭购买对话框
    isModalVisible.value = false;
    cardCode.value = "";
    username.value = "";

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
  cardCode.value = "";
  username.value = "";
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
    <Flex vertical :gap="60" class="business-container">
      <!-- Company header section -->
      <Flex vertical :gap="0" class="company-header">
        <Flex align="center" justify="space-between" :gap="16" style="flex: 1">
          <Flex class="mb-30" vertical align="start" justify="start" :gap="16">
            <a-typography-title :level="1" class="company-title">
              <div
                class="business-page-markdown-area"
                v-html="markdownToHTML(settings?.shopName || '')"
              ></div>
            </a-typography-title>
            <a-typography-paragraph class="company-desc">
              <div
                class="business-page-markdown-area"
                v-html="markdownToHTML(settings?.shopDescription || '')"
              ></div>
            </a-typography-paragraph>

            <Flex :gap="16" align="center">
              <a-input
                v-model:value="formData.code"
                :placeholder="$t('请输入激活码，列如：KNFI19SiWO25IBN2FON2A24NJIO')"
                size="large"
                style="width: 320px"
              >
              </a-input>

              <a-button
                type="primary"
                class="button-color-success"
                size="large"
                @click="activeInstance"
              >
                {{ $t("激活实例") }}
              </a-button>
              <a-button type="primary" size="large" @click="toLoginPage">
                {{ $t("进入控制台") }}
              </a-button>
            </Flex>

            <div style="opacity: 0.4">
              <a-typography-paragraph style="text-align: left">
                <span v-html="markdownToHTML(settings?.shopTip || '')"></span>
              </a-typography-paragraph>
            </div>
          </Flex>

          <Flex justify="center" align="center" class="mr-40">
            <div>
              <IconFly />
            </div>
          </Flex>
        </Flex>

        <div class="down-icon-container">
          <DownIcon :text="$t('向下滚动查看更多')" />
        </div>
      </Flex>
      <!-- Products section -->
      <div class="section">
        <Flex vertical :gap="32">
          <a-typography-paragraph class="section-title">
            <a-typography-title :level="1"> {{ $t("服务套餐") }} </a-typography-title>
            <a-typography-text class="section-sub-title" type="secondary">
              {{ $t("我们提供多种服务套餐，满足您的需求，请选择适合您的套餐。") }}
            </a-typography-text>
          </a-typography-paragraph>

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
                <!-- Product title -->
                <a-typography-title :level="3" class="product-title">
                  {{ product.title }}
                </a-typography-title>

                <!-- Price -->
                <Flex align="baseline" :gap="8">
                  <a-typography-title :level="2" class="product-price">
                    {{ product.price }}
                  </a-typography-title>
                  <a-typography-text class="price-unit"> {{ $t("/月") }} </a-typography-text>
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
                <Button
                  type="primary"
                  size="large"
                  class="buy-button"
                  @click="showBuyModal(product)"
                >
                  {{ $t("立即购买") }}
                </Button>
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </div>

      <div class="section">
        <Flex vertical :gap="32">
          <a-typography-paragraph class="section-title">
            <a-typography-title :level="1"> {{ $t("用户友好，易于使用") }} </a-typography-title>
            <a-typography-text class="section-sub-title" type="secondary">
              {{ $t("基于 MCSManager 面板提供可视化服务，快捷部署任意服务。") }}
            </a-typography-text>
          </a-typography-paragraph>

          <div></div>
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
    <Modal
      v-model:open="isModalVisible"
      :title="$t('购买服务')"
      :ok-text="$t('确定')"
      :cancel-text="$t('取消')"
      @ok="handleBuyConfirm"
      @cancel="handleBuyCancel"
    >
      <a-form :model="{ cardCode, username }" :rules="formRules" layout="vertical">
        <a-form-item :label="$t('为哪个账号购买？')" name="username">
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ $t("请确保输入的用户名正确，如果用户不存在则会自动创建，请勿使用他人账号购买。") }}
            </a-typography-text>
          </a-typography-paragraph>
          <a-input v-model:value="username" :placeholder="$t('请输入用户名')" size="large" />
        </a-form-item>

        <a-form-item :label="$t('兑换码')" name="cardCode">
          <a-input v-model:value="cardCode" :placeholder="$t('请输入兑换码')" size="large" />
        </a-form-item>
      </a-form>
    </Modal>

    <!-- 激活成功弹窗 -->
    <Modal
      v-model:open="isSuccessModalVisible"
      :title="successInfo.title"
      :footer="null"
      :closable="false"
      :mask-closable="false"
      width="500px"
    >
      <div class="success-modal-content">
        <!-- 成功图标 -->
        <div class="success-icon">
          <a-result status="success" :title="successInfo.title">
            <template #icon>
              <div class="success-icon-wrapper">✅</div>
            </template>
          </a-result>
        </div>

        <!-- 成功消息 -->
        <div class="success-message">
          <a-typography-paragraph>
            {{ successInfo.message }}
          </a-typography-paragraph>
        </div>

        <!-- 实例信息展示 -->
        <div v-if="successInfo.instanceInfo" class="instance-info">
          <a-typography-title :level="4">{{ $t("实例信息") }}</a-typography-title>
          <div v-if="successInfo.instanceInfo.instance_id" class="info-item">
            <span class="info-label">{{ $t("实例ID") }}:</span>
            <span class="info-value">{{ successInfo.instanceInfo.instance_id }}</span>
          </div>
          <div v-if="successInfo.instanceInfo.username" class="info-item">
            <span class="info-label">{{ $t("用户名") }}:</span>
            <span class="info-value">{{ successInfo.instanceInfo.username }}</span>
          </div>
          <div v-if="successInfo.instanceInfo.expire" class="info-item">
            <span class="info-label">{{ $t("到期时间") }}:</span>
            <span class="info-value">{{
              new Date(successInfo.instanceInfo.expire).toLocaleDateString()
            }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="success-actions">
          <a-space>
            <a-button @click="handleSuccessModalClose">
              {{ $t("稍后处理") }}
            </a-button>
            <a-button type="primary" @click="handleSuccessToLogin">
              {{ $t("立即登录") }}
            </a-button>
          </a-space>
        </div>
      </div>
    </Modal>
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

.down-icon-container {
  height: 60px;
}

.business-container {
  min-height: 100vh;

  p {
    margin-bottom: 0px !important;
    margin-top: 0px !important;
  }
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

/* Company header styles */
.company-header {
  text-align: center;
  height: 100vh;
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

.product-card {
  @extend .base-block;
  width: 320px;
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

/* 成功弹窗样式 */
.success-modal-content {
  text-align: center;
  padding: 20px 0;
}

.success-icon-wrapper {
  font-size: 4rem;
  margin-bottom: 16px;
}

.success-message {
  margin: 20px 0;

  .ant-typography {
    font-size: 1.1rem;
    color: var(--color-gray-10);
    margin-bottom: 0 !important;
  }
}

.instance-info {
  background: var(--color-gray-2);
  border: 1px solid var(--color-gray-4);
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
  text-align: left;

  .ant-typography-title {
    margin-bottom: 12px !important;
    color: var(--color-gray-12);
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-gray-3);

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  color: var(--color-gray-8);
  font-weight: 500;
  min-width: 80px;
}

.info-value {
  color: var(--color-gray-12);
  font-weight: 600;
  word-break: break-all;
}

.success-actions {
  margin-top: 24px;

  .ant-btn {
    min-width: 100px;
  }
}
</style>
