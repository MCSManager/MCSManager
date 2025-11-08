<script lang="ts" setup>
import { useShop } from "@/hooks/useShop";
import { t } from "@/lang/i18n";
import type { Settings } from "@/types";
import { EditOutlined } from "@ant-design/icons-vue";
import { Button, Form, Input, message, Modal } from "ant-design-vue";
import { ref } from "vue";

const { refreshSettingInfo, updateShopInfo } = useShop();

// Dialog visibility state
const visible = ref(false);

// Form data
const formData = ref<Partial<Settings>>({
  shopName: "",
  shopEmail: "",
  shopDescription: "",
  shopTip: ""
});

// Submit loading state
const loading = ref(false);

// Show dialog
const showDialog = async () => {
  const settingInfo = await refreshSettingInfo();
  formData.value = settingInfo.value || {};
  visible.value = true;
};

// Hide dialog
const hideDialog = () => {
  visible.value = false;
};

// Submit form
const handleSubmit = async () => {
  try {
    loading.value = true;
    await updateShopInfo({
      ...formData.value
    });
    message.success(t("信息更新成功，网页稍后将进行刷新..."));
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    message.error(t("更新失败，请重试"));
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Floating button -->
    <div class="floating-button" @click="showDialog">
      <EditOutlined class="icon" />
      <span class="tooltip">{{ $t("编辑店铺信息") }}</span>
    </div>

    <!-- Form dialog -->
    <Modal
      v-model:open="visible"
      :title="$t('编辑店铺信息')"
      :width="600"
      :footer="null"
      @cancel="hideDialog"
    >
      <a-typography-paragraph>
        <a-typography-text>
          {{ $t("所有文本均支持 Markdown 格式来自定义超链接，列表等特殊格式。") }}
        </a-typography-text>
      </a-typography-paragraph>

      <Form :model="formData" layout="vertical" class="shop-form" @finish="handleSubmit">
        <Form.Item :label="$t('首页名称')" name="shopName" required>
          <Input
            v-model:value="formData.shopName"
            :placeholder="$t('请输入店铺名称')"
            size="large"
          />
        </Form.Item>
        <Form.Item :label="$t('首页描述文字')" name="shopDescription">
          <Input.TextArea
            v-model:value="formData.shopDescription"
            :placeholder="$t('请输入店铺描述信息')"
            :rows="4"
            size="large"
          />
        </Form.Item>
        <Form.Item :label="$t('首页描述二级文字')" name="shopTip">
          <Input.TextArea
            v-model:value="formData.shopTip"
            :placeholder="$t('请输入店铺提示信息')"
            :rows="3"
            size="large"
          />
        </Form.Item>

        <Form.Item :label="$t('页脚信息')" name="loginInfo">
          <Input
            v-model:value="formData.loginInfo"
            :placeholder="$t('请输入页脚信息，可以输入版权信息，备案信息，支持 Markdown')"
            size="large"
          />
        </Form.Item>

        <Form.Item :label="$t('页脚联系邮箱方式')" name="shopEmail" required>
          <Input
            v-model:value="formData.shopEmail"
            :placeholder="$t('请输入店铺联系邮箱')"
            size="large"
          />
        </Form.Item>

        <Form.Item class="form-actions">
          <div class="button-group">
            <Button size="large" @click="hideDialog"> {{ $t("取消") }} </Button>
            <Button type="primary" html-type="submit" :loading="loading" size="large">
              {{ $t("保存") }}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped lang="scss">
:root {
  --mx: 86.5px;
  --my: 14px;
}

.floating-button {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 42px;
  height: 42px;
  box-shadow:
    0 16px 40px #00000073,
    0 0 18px #40a0ff26;
  background: radial-gradient(
      140px 120px at var(--mx, 50%) var(--my, 50%),
      rgba(64, 158, 255, 0.28),
      transparent 60%
    ),
    radial-gradient(
      220px 160px at calc(var(--mx, 50%) + 40px) calc(var(--my, 50%) + 36px),
      rgba(0, 191, 255, 0.18),
      transparent 65%
    ),
    linear-gradient(180deg, #409eff, #1e90ff 90%, #3a8ee6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);

    .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-100%) translateY(-50%);
    }
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  .icon {
    font-size: 18px;
    color: white;
  }

  .tooltip {
    position: absolute;
    right: 70px;
    top: 50%;
    transform: translateX(-100%) translateY(-50%) translateX(10px);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;

    &::after {
      content: "";
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid rgba(0, 0, 0, 0.8);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }
  }
}

.shop-form {
  .form-actions {
    margin-bottom: 0;

    .button-group {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .floating-button {
    bottom: 80px;
    right: 20px;
    width: 50px;
    height: 50px;

    .icon {
      font-size: 20px;
    }

    .tooltip {
      font-size: 11px;
      padding: 6px 10px;
    }
  }
}
</style>
