<script setup lang="ts">
import introductionImage2 from "@/assets/images/introduction-2.png";
import introductionImage3 from "@/assets/images/introduction-3.png";
import introductionImage5 from "@/assets/images/introduction-5.png";
import BuyModal from "@/components/BuyModal.vue";
import ShopInfoUpdateDialog from "@/components/ShopInfoUpdateDialog.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import { router } from "@/config/router";
import { useShop } from "@/hooks/useShop";
import { requestBuyInstance, type FrontProductInfo } from "@/services/apis/redeem";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { markdownToHTML } from "@/tools/safe";
import { reportErrorMsg } from "@/tools/validator";
import {
  ApiOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  GlobalOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined
} from "@ant-design/icons-vue";
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

// 支持的游戏和应用类型
const gameFeatures = [
  {
    id: "minecraft",
    icon: CloudServerOutlined,
    title: "Minecraft、Terraria 等",
    description: "完美支持 Java 版和基岩版，包括 Forge、Fabric、Spigot、Paper 等各类服务端"
  },

  {
    id: "steam",
    icon: RocketOutlined,
    title: "大多数 Steam 游戏",
    description: "支持 CS:GO、Rust、ARK、Valheim 等热门 Steam 游戏服务器"
  },
  {
    id: "terraria",
    icon: GlobalOutlined,
    title: "Docker 虚拟化",
    description: "基于 Docker 进行资源隔离，以确保互不影响，资源使用限制合理，安全可靠"
  },
  {
    id: "nodejs",
    icon: ThunderboltOutlined,
    title: "各类程序运行时环境",
    description: "我们可以基于 Docker 为您提供任何您想要的运行时环境，提供灵活的算力支持"
  },
  {
    id: "python",
    icon: CodeOutlined,
    title: "各类应用市场",
    description: "我们为您提供了丰富的应用市场，您可以在这里找到您想要的任何应用"
  },
  {
    id: "custom",
    icon: ApiOutlined,
    title: "更多意想不到的场景",
    description: "支持任何可执行程序，灵活配置启动命令和运行参数"
  }
];

// 核心功能特性
const coreFeatures = [
  {
    id: "monitor",
    icon: DashboardOutlined,
    title: "实时监控",
    description:
      "实时查看服务器状态、CPU、内存占用，掌握运行状况。支持历史数据查询和性能分析，让问题无处遁形。"
  },
  {
    id: "console",
    icon: DeploymentUnitOutlined,
    title: "可视化控制台",
    description:
      "无需 SSH，通过 Web 界面直接管理服务器。支持文件管理、配置编辑、命令执行，操作简单直观。"
  },
  {
    id: "automation",
    icon: ReloadOutlined,
    title: "自动化运维",
    description:
      "支持定时任务、自动备份、崩溃自动重启。提供多种触发器，实现无人值守的智能运维管理。"
  },
  {
    id: "security",
    icon: SafetyOutlined,
    title: "安全可靠",
    description: "多重权限管理，用户隔离保护。支持两步验证、IP 白名单，全方位保障服务器安全。"
  },
  {
    id: "deploy",
    icon: RocketOutlined,
    title: "一键部署",
    description: "预设多种服务器模板，快速创建和部署。支持 Docker 容器化，环境隔离更安全。"
  },
  {
    id: "distributed",
    icon: CloudServerOutlined,
    title: "分布式架构",
    description: "支持多节点集群管理，统一控制面板操作多台服务器。轻松实现跨地域的分布式部署。"
  }
];

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
        <Flex vertical :gap="48" align="center">
          <a-typography-paragraph class="section-title">
            <a-typography-title :level="1">
              {{ $t("支持众多使用场景 & 游戏服务器") }}
            </a-typography-title>
            <a-typography-text class="section-sub-title" type="secondary">
              {{ $t("从 Minecraft 到 Terraria，轻松管理各类游戏服务器 & 各类应用") }}
            </a-typography-text>
          </a-typography-paragraph>

          <a-row :gutter="[24, 24]" style="width: 100%; max-width: 1200px">
            <a-col v-for="feature in gameFeatures" :key="feature.id" :xs="24" :sm="12" :lg="8">
              <div class="feature-card">
                <div class="feature-icon" :class="`${feature.id}-icon`">
                  <a-typography-text>
                    <component :is="feature.icon" />
                  </a-typography-text>
                </div>
                <a-typography-title :level="4" class="feature-title">
                  {{ feature.title }}
                </a-typography-title>
                <a-typography-text type="secondary" class="feature-desc">
                  {{ feature.description }}
                </a-typography-text>
              </div>
            </a-col>
          </a-row>
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

          <Flex justify="center" align="center" class="images-stack-container">
            <img
              :src="introductionImages[1]"
              style="max-width: 1100px; width: 100%; object-fit: cover"
            />
          </Flex>
        </Flex>
      </div>

      <div class="section">
        <Flex vertical :gap="48" align="center">
          <a-typography-paragraph class="section-title">
            <a-typography-title :level="1">
              {{ $t("更多强大核心功能") }}
            </a-typography-title>
            <a-typography-text class="section-sub-title" type="secondary">
              {{ $t("专业的服务器管理工具，让运维更简单") }}
            </a-typography-text>
          </a-typography-paragraph>

          <a-row :gutter="[32, 32]" style="width: 100%; max-width: 1200px">
            <a-col v-for="feature in coreFeatures" :key="feature.id" :xs="24" :md="12">
              <div class="benefit-card">
                <div class="benefit-icon-wrapper">
                  <a-typography-text>
                    <component :is="feature.icon" class="benefit-icon" />
                  </a-typography-text>
                </div>
                <div class="benefit-content">
                  <a-typography-title :level="3" class="benefit-title">
                    {{ feature.title }}
                  </a-typography-title>
                  <a-typography-text type="secondary" class="benefit-desc">
                    {{ feature.description }}
                  </a-typography-text>
                </div>
              </div>
            </a-col>
          </a-row>
        </Flex>
      </div>

      <div class="section">
        <Flex vertical :gap="32">
          <a-typography-paragraph class="section-title">
            <a-typography-title :level="1"> {{ $t("提供各类安装模板") }} </a-typography-title>
            <a-typography-text class="section-sub-title" type="secondary">
              {{ $t("提供各类安装模板，一键部署，快捷方便。") }}
            </a-typography-text>
          </a-typography-paragraph>

          <Flex justify="center" align="center" class="images-stack-container">
            <img
              :src="introductionImages[2]"
              style="max-width: 1000px; width: 100%; object-fit: cover"
            />
          </Flex>
        </Flex>
      </div>

      <footer class="footer-container">
        <Flex justify="space-between" align="center" vertical gap="8">
          <a-typography-text>
            <Flex align="center" :gap="8" justify="center" style="margin-bottom: 8px">
              <span>© Copyright {{ new Date().getFullYear() }}</span>
              <a-divider type="vertical" style="height: 9px" />
              <span v-html="markdownToHTML(settings?.loginInfo || '')"></span>
              <a-divider type="vertical" style="height: 9px" />
              <span v-html="markdownToHTML(settings?.shopEmail || '')"></span>
            </Flex>
          </a-typography-text>
          <a-typography-text>
            <span>
              <span>Powered by </span>
              <a href="https://mcsmanager.com" target="_blank">MCSManager</a>
            </span>
          </a-typography-text>

          <a-typography-text>
            <Flex v-if="isAdmin" justify="center" align="center" class="admin-message">
              {{
                $t(
                  '右侧编辑悬浮球可以修改页面上的文字，如果您想深度定制此页，则需要开发人员修改 "frontend/src/views/Business.vue" 文件（仅管理员可见）'
                )
              }}
            </Flex>
          </a-typography-text>
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
@import "@/assets/global.scss";
@import "@/assets/base.scss";
@import "@/assets/tools.scss";
@import "@/assets/variables.scss";
@import "@/assets/variables-dark.scss";

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
  color: var(--color-text-4);
  padding: 40px;
  text-align: center;
  font-size: 13px;
  margin-top: 80px;

  a {
    color: var(--color-text-4);
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

/* Feature Cards Styles */
.feature-card {
  background: var(--color-fill-2);
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px var(--color-shadow);
    border-color: var(--color-primary-light-3);
  }
}

.feature-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--color-primary-light-1), var(--color-primary-light-3));
  transition: transform 0.3s ease;
  color: var(--color-primary-6);

  :deep(.anticon) {
    font-size: 36px;
  }

  .feature-card:hover & {
    transform: scale(1.1);
  }
}

.feature-title {
  margin: 0 !important;
  font-weight: 600;
}

.feature-desc {
  font-size: 14px;
  line-height: 1.6;
}

/* Benefit Cards Styles */
.benefit-card {
  background: var(--color-fill-2);
  border: 1px solid var(--color-border-2);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  transition: all 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px var(--color-shadow);
    border-color: var(--color-primary-light-4);
  }
}

.benefit-icon-wrapper {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary-light-2), var(--color-primary-light-4));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

  .benefit-card:hover & {
    transform: rotate(5deg) scale(1.05);
  }
}

.benefit-icon {
  font-size: 32px;
  color: var(--color-primary-6);
}

.benefit-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-title {
  margin: 0 !important;

  font-weight: 600;
  font-size: 20px !important;
}

.benefit-desc {
  font-size: 14px;
  line-height: 1.7;
}

.section-sub-title {
  display: block;
  margin-top: 12px;
  font-size: 16px !important;
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

  .section {
    padding: 40px 20px !important;
  }

  .feature-card {
    padding: 24px 20px;
  }

  .benefit-card {
    padding: 24px;
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .benefit-content {
    align-items: center;
  }

  .feature-icon {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }

  .benefit-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .benefit-icon {
    font-size: 28px;
  }
}
</style>
