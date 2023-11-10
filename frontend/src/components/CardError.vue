<script lang="ts" setup>
import { t } from "@/lang/i18n";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import {
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from "@ant-design/icons-vue";

const { containerState } = useLayoutContainerStore();
CloseCircleOutlined;
ExclamationCircleOutlined;
defineProps<{
  title: string;
  error: Error;
}>();
</script>

<template>
  <CardPanel>
    <template #title>{{ title }}</template>
    <template #body>
      <div class="flex justify-center align-center h-100">
        <div class="">
          <a-typography-paragraph v-if="containerState.showNewCardDialog" :level="5">
            <ExclamationCircleOutlined />
            {{ t("此卡片无法在新增时预览，请添加后填写相关参数卡片即可正常运作。") }}
          </a-typography-paragraph>
          <template v-else>
            <div>
              <a-typography-paragraph>
                <ExclamationCircleOutlined />
                {{ t("此卡片运行错误，请刷新网页重试") }}
              </a-typography-paragraph>

              <a-typography-paragraph>
                <div>
                  {{ t("错误信息：") }}
                </div>
                <pre>{{ error.message ? error.message : error }}</pre>
              </a-typography-paragraph>
            </div>
          </template>
        </div>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.icon {
  text-align: center;
  color: var(--color-gray-7);
}
</style>
