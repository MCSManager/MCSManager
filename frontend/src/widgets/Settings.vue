<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { ref } from "vue";
import { ProjectOutlined, RobotOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const menus = [
  {
    title: t("基本信息"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  {
    title: t("第三方接口"),
    key: "api",
    icon: RobotOutlined
  },
  {
    title: t("账号安全"),
    key: "password",
    icon: RobotOutlined
  }
];

const formData = ref({
  language: "en_US",
  tmp: ""
});

const allLanguages = [
  {
    label: "中文",
    value: "zh_CN"
  },
  {
    label: "English",
    value: "en_US"
  }
];
</script>

<template>
  <div>
    <div></div>

    <CardPanel class="CardWrapper" style="height: 100%" :padding="false">
      <template #body>
        <LeftMenusPanel :menus="menus">
          <template #baseInfo>
            <div style="text-align: left">
              <a-form :model="formData" layout="vertical">
                <a-row :gutter="[24, 24]" class="">
                  <a-col :lg="12">
                    <a-form-item label="面板语言">
                      <a-select v-model:value="formData.language">
                        <a-select-option
                          v-for="item in allLanguages"
                          :key="item.value"
                          :value="item.value"
                        >
                          {{ item.label }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :lg="12">
                    <a-form-item label="面板端口">
                      <a-input v-model:value="formData.tmp" placeholder="请输入内容" />
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-form-item label="登录页文字展示">
                  <a-typography-paragraph>
                    <a-typography-text type="secondary">
                      {{ t("支持 Markdown 格式") }}
                    </a-typography-text>
                  </a-typography-paragraph>
                  <a-textarea v-model:value="formData.tmp" :rows="4" placeholder="请输入内容" />
                </a-form-item>
              </a-form>
            </div>
          </template>
          <template #api> B </template>
        </LeftMenusPanel>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped></style>
