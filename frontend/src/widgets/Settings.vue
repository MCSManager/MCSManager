<script setup lang="ts">
import LeftMenusPanel from "@/components/LeftMenusPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { onMounted, ref } from "vue";
import {
  LockOutlined,
  ProjectOutlined,
  QuestionCircleOutlined
  // QuestionOutlined,
  // RobotOutlined
} from "@ant-design/icons-vue";

import { settingInfo } from "@/services/apis";

// const props = defineProps<{
defineProps<{
  card: LayoutCard;
}>();

const { execute, state, isLoading, isReady } = settingInfo();

onMounted(async () => {
  const { value: res } = await execute();
  console.log(res);
});

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

const allYesNo = [
  {
    label: t("启用"),
    value: true
  },
  {
    label: t("禁止"),
    value: false
  }
];

const formData = ref({
  httpPort: 23333,
  httpIp: null,
  dataPort: 23334,
  forwardType: 1,
  crossDomain: false,
  gzip: false,
  maxCompress: 1,
  maxDownload: 10,
  zipType: 1,
  loginCheckIp: true,
  loginInfo: "",
  canFileManager: true,
  quickInstallAddr: "https://mcsmanager.oss-cn-guangzhou.aliyuncs.com/quick_install.json",
  redisUrl: "",
  language: "en_US",
  tmp: ""
});
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
                      v-model:value="formData.httpPort"
                      style="max-width: 320px"
                      :placeholder="t('请输入内容')"
                    />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("登录页文字展示") }}</a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("支持 Markdown 格式") }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-textarea
                      v-model:value="formData.loginInfo"
                      :rows="4"
                      :placeholder="t('请输入内容')"
                    />
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
                      v-model:value="formData.httpIp"
                      style="max-width: 320px"
                      :placeholder="t('请输入内容')"
                    />
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">{{ t("预设资源下载点") }}</a-typography-title>
                    <a-typography-paragraph type="secondary">
                      {{
                        t(
                          "快速安装服务器时的下载源列表，您可以通过更改此地址实现自定义服务端预设下载站。"
                        )
                      }}
                    </a-typography-paragraph>
                    <a-input
                      v-model:value="formData.quickInstallAddr"
                      style="max-width: 320px"
                      :placeholder="t('请输入内容')"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </div>
          </template>

          <template #api>
            <div style="max-height: 500px; overflow-y: auto">
              <a-typography-title :level="4" class="mb-24">{{ t("安全设置") }}</a-typography-title>
              <div style="text-align: left">
                <a-form :model="formData" layout="vertical">
                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("准许普通用户使用文件管理功能") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{ t("文件管理是一个较为消耗资源且不易控制的功能。") }}
                        <br />
                        {{
                          t("如果您的普通用户没有文件管理的任何需求，可以禁止用户使用文件管理。")
                        }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value="formData.canFileManager" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("跨域请求 API 接口") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{
                          t(
                            "HTTP 响应将会加入 access-control-allow-origin: *，可能会降低安全性，但是会提高开发扩展性。"
                          )
                        }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value="formData.crossDomain" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>

                  <a-form-item>
                    <a-typography-title :level="5">
                      {{ t("同 IP 登录次数限制") }}
                    </a-typography-title>
                    <a-typography-paragraph>
                      <a-typography-text type="secondary">
                        {{
                          t(
                            "此功能将保护您的面板不被单个主机暴力破解密码，每个 IP 只有 10 次密码错误次数。"
                          )
                        }}
                      </a-typography-text>
                    </a-typography-paragraph>
                    <a-select v-model:value="formData.loginCheckIp" style="max-width: 320px">
                      <a-select-option
                        v-for="item in allYesNo"
                        :key="item.value"
                        :value="item.value"
                      >
                        {{ item.label }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-form>
                <a-typography-title :level="5">
                  {{ t("注意事项") }}
                </a-typography-title>
                <a-typography-paragraph>
                  <a-typography-text type="secondary">
                    {{
                      t(
                        "这些配置设置需要一部分专业知识，您可以根据您的硬件设备来大概猜测哪些值适合您。"
                      )
                    }}
                    <br />
                    {{
                      t(
                        "一般情况下，默认值可以满足个人日常的使用场景，如果规模一旦更大，对硬件的要求更高，为了不过分损失用户体验，一个合适的阈值是十分重要的."
                      )
                    }}
                  </a-typography-text>
                </a-typography-paragraph>
              </div>
            </div>
          </template>

          <template #password>
            <div style="max-height: 500px; overflow-y: auto">
              <a-typography-title :level="4" class="mb-24">{{ t("关于") }}</a-typography-title>
              <div style="text-align: left">
                <a-form-item>
                  <a-typography-title :level="5">
                    {{ t("软件根据 Apache-2.0 开源软件协议发行") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-typography-text type="secondary">
                      {{ t("https://github.com/MCSManager/MCSManager/blob/master/LICENSE") }}
                    </a-typography-text>
                  </a-typography-paragraph>
                </a-form-item>

                <a-form-item>
                  <a-typography-title :level="5">
                    {{ t("开源项目赞助名单") }}
                  </a-typography-title>
                  <a-typography-paragraph>
                    <a-typography-text type="secondary">
                      {{ t("只含前 40 名赞助者，查看完整赞助名单或进行赞助支持请前往") }}
                      <a href="https://mcsmanager.com/" target="_blank">MCSManager.com</a>&nbsp;.
                    </a-typography-text>
                  </a-typography-paragraph>
                </a-form-item>
              </div>
            </div>
          </template>
        </LeftMenusPanel>
      </template>
    </CardPanel>
  </div>
</template>

<style lang="scss" scoped></style>
