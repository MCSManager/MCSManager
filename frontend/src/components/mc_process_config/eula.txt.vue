<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";

const props = defineProps<{
  config: Object;
}>();

const description = {
  eula: t("是否同意 Minecraft EULA协议，如果您要启动 Minecraft 服务器，则此选项是必须开启")
};
</script>

<template>
  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <a-typography>
          <a-typography-title :level="5">{{ t("关于配置文件") }}</a-typography-title>
          <a-typography-paragraph>
            {{
              t(
                "此配置文件为 Minecraft 服务端的 EULA（最终用户许可协议），您必须同意此协议才可以正常运行服务端软件，如果您发现此设置并不是“是”状态，那么请立即修改。"
              )
            }}
          </a-typography-paragraph>
        </a-typography>
        <a-typography>
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

  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <div v-for="(item, index) in config" :key="index">
          <LineOption :option-value="config" :option-key="index">
            <template #title>{{ index }}</template>
            <template #info>{{ getDescriptionByTitle(description, index) }}</template>
          </LineOption>
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
