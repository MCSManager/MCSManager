<script setup lang="ts">
import { markdownToHTML } from "@/tools/safe";
import { Flex } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import DownIcon from "./DownIcon.vue";
import IconFly from "./IconFly.vue";

interface Props {
  shopName?: string;
  shopDescription?: string;
  shopTip?: string;
}

interface Emits {
  (e: "toLogin"): void;
}

defineProps<Props>();
defineEmits<Emits>();

const { t } = useI18n();
</script>

<template>
  <Flex vertical :gap="0" justify="center" class="company-header">
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
          <a-button type="primary" size="large" @click="$emit('toLogin')">
            {{ t("进入控制台") }}
          </a-button>
        </Flex>

        <div style="opacity: 0.4">
          <a-typography-paragraph style="text-align: left">
            <span v-html="markdownToHTML(shopTip || '')"></span>
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
      <DownIcon :text="t('向下滚动查看更多')" />
    </div>
  </Flex>
</template>

<style lang="scss">
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
</style>
