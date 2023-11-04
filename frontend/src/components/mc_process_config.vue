<script setup lang="ts">
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";
import { jsonToMap } from "@/tools/common";
import isEmpty from "lodash/isEmpty";
import { configData } from "@/config/mc_process_config";

const props = defineProps<{
  config: Record<string, any>;
  configName: string;
}>();

const data:
  | {
      desc: string;
      config: Record<string, any>;
    }
  | undefined = configData[props.configName];

const parsedConfig = jsonToMap(props.config);
</script>

<template>
  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <a-typography>
          <a-typography-title :level="5">
            {{ data ? t("关于此配置文件") : t("未知配置文件") }}
          </a-typography-title>
          <a-typography-paragraph v-if="data">
            {{ data?.desc }}
          </a-typography-paragraph>
          <a-typography-paragraph v-else>
            {{ t("我们将很快支持该文件，敬请期待") }}
            <br />
            {{ t("您可前往") }}
            <a href="https://github.com/MCSManager/MCSManager" target="_blank">
              https://github.com/MCSManager/MCSManager
            </a>
            {{ t("提交反馈") }}
          </a-typography-paragraph>
        </a-typography>
        <a-typography v-if="configName == 'common/eula.txt' && data">
          <a-typography-title :level="5">{{ t("什么是最终用户许可协议") }}</a-typography-title>
          <a-typography-paragraph>
            {{
              t(
                "最终用户许可协议是软件应用程序作者或者发布者与应用程序使用者之间的合法合同。最终用户许可协议（EULA），通常是指“软件许可”，它与租赁协议类似；用户同意支付软件的使用费用，并且向软件作者或者发行者承诺遵守EULA中规定的所有约束条件。用户被告知，当他们打开软件包的包装、打开CD盒的封条、将卡片寄回给软件发行者、安装应用程序、执行下载文件或者简单的使用应用程序的时候就意味着他们已经“接受”了EULA中的条款。"
              )
            }}
          </a-typography-paragraph>
        </a-typography>
      </template>
    </CardPanel>
  </a-col>
  <a-col v-if="data" :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <div v-if="!isEmpty(props.config)">
          <div v-for="(item, index) in parsedConfig" :key="index">
            <LineOption :option-value="parsedConfig" :option-key="index">
              <template #title>{{ index }}</template>
              <template #info>{{ getDescriptionByTitle(data?.config, index) }}</template>
            </LineOption>
          </div>
        </div>
        <div v-else>
          {{ t("配置文件内容为空，请检查文件是否正确，或点击上方 “编辑源文件” 按钮继续编辑") }}
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
