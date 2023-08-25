<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { ref } from "vue";
import {
  LockOutlined,
  ProjectOutlined,
  QuestionCircleOutlined,
  QuestionOutlined,
  RobotOutlined
} from "@ant-design/icons-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const menus = [
  {
    title: t("基本设置"),
    key: "baseInfo",
    icon: ProjectOutlined
  },
  {
    title: t("安全设置"),
    key: "api",
    icon: LockOutlined
  },
  {
    title: t("关于"),
    key: "password",
    icon: QuestionCircleOutlined
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
            <div style="max-height: 500px; overflow-y: auto">
              <a-typography-title :level="4" class="mb-24">{{ t("基本配置") }}</a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("面板语言") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("此处语言修改会同步修改所有节点与所有用户的语言。") }}
                        <br />
                        {{ t("但是不包括自定义的卡片标题或者自定义的其他语言内容。") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value="formData.language" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allLanguages"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("面板端口") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{ t("网页访问端口，请填写一个纯数字，默认端口是 23333 端口。") }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.tmp"
                      style="max-width: 320px"
                      placeholder="请输入内容"
                    />
                  </a-form-item>
                  <a-form-item>
                    <a-typography-title :level="5">{{ t("登录页文字展示") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("支持 Markdown 格式") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-textarea v-model:value="formData.tmp" :rows="4" placeholder="请输入内容" />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("面板绑定IP") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{
                        t(
                          "适用于主机上拥有多张网卡多个IP地址的情况，如果您只有一个公网IP，那么请不要配置此项。"
                        )
                      }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.tmp"
                      style="max-width: 320px"
                      placeholder="请输入内容"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </div>
          </template>
          <template #api> B </template>
        </LeftMenusPanel>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped></style>
