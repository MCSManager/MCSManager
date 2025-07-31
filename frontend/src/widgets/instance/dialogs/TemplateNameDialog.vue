<script setup lang="ts">
import { ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import type { QuickStartPackages } from "@/types";
import type { FormInstance } from "ant-design-vue";

const props = defineProps<{
  open: boolean;
  template: QuickStartPackages | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [instanceName: string, template: QuickStartPackages];
}>();

const formRef = ref<FormInstance>();
const formData = reactive({
  instanceName: ""
});

const rules: Record<string, any> = {
  instanceName: [
    { required: true, message: t("请输入名称"), trigger: "blur" },
    { min: 1, max: 30, message: t("名称长度应在1-30个字符之间"), trigger: "blur" }
  ]
};

const handleCancel = () => {
  emit("update:open", false);
  formData.instanceName = "";
  formRef.value?.resetFields();
};

const handleConfirm = async () => {
  try {
    await formRef.value?.validate();
    if (props.template) {
      emit("confirm", formData.instanceName, props.template);
      handleCancel();
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};
</script>

<template>
  <a-modal
    :open="open"
    :title="t('使用模板快速开始')"
    :width="500"
    :footer="null"
    :destroy-on-close="true"
    @cancel="handleCancel"
  >
    <div v-if="template" class="template-info">
      <div class="template-header">
        <img
          v-if="template.image"
          :src="template.image"
          :alt="template.title"
          class="template-image"
        />
        <div class="template-details">
          <h3 class="template-title">{{ template.title }}</h3>
          <p class="template-description">{{ template.description }}</p>
          <div class="template-meta">
            <span class="meta-item">
              <strong>{{ t("类别") }}:</strong> {{ template.category }}
            </span>
            <span class="meta-item">
              <strong>{{ t("平台") }}:</strong> {{ template.platform }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical" class="instance-form">
      <a-form-item :label="t('取个好听的名字吧！')" name="instanceName">
        <a-input
          v-model:value="formData.instanceName"
          :placeholder="t('请输入名称')"
          :maxlength="50"
          show-count
        />
      </a-form-item>
    </a-form>

    <div class="dialog-footer">
      <a-button @click="handleCancel">
        {{ t("取消") }}
      </a-button>
      <a-button type="primary" @click="handleConfirm">
        {{ t("开始安装") }}
      </a-button>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.template-info {
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--color-gray-2);
  border-radius: 8px;
  border: 1px solid var(--color-gray-5);

  .template-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    .template-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
      border: 1px solid var(--color-gray-5);
      transition: all 0.3s ease;
    }

    .template-image:hover {
      border: 1px solid var(--color-gray-7);
      transform: scale(1.05);
    }

    .template-details {
      flex: 1;

      .template-title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-gray-10);
      }

      .template-description {
        margin: 0 0 12px 0;
        color: var(--color-gray-8);
        font-size: 14px;
        line-height: 1.5;
      }

      .template-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .meta-item {
          font-size: 12px;
          color: var(--color-gray-7);

          strong {
            color: var(--color-gray-9);
          }
        }
      }
    }
  }
}

.instance-form {
  margin-bottom: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
