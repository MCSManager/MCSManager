<script setup lang="ts">
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";
import { jsonToMap } from "@/tools/common";

const props = defineProps<{
  config: Record<string, any>;
}>();

const description = {
  settings: {
    "allow-end": t("是否开启末地"),
    "warn-on-overload": t("服务器过载警告"),
    "permissions-file": t("自定义权限文件的名字"),
    "update-folder": t(
      "插件更新文件夹，放进新版本插件的文件夹名字，这个文件夹会在服务器重新启动时自动更新插件"
    ),
    "plugin-profiling": t("允许使用命令 /timings。用于测量插件为事件所花费的时间"),
    "connection-throttle": t("客户端在最近一次连接尝试后，在允许再次连接之前的间隔"),
    "query-plugins": t("在 MCSM 内置控制台查询时，服务器是否返回插件列表"),
    "deprecated-verbose": t("当插件注册已弃用事件时，服务器是否显示警告"),
    "shutdown-message": t("服务器关闭后游戏客户端提示的信息"),
    "minimum-api": t("防止加载具有不兼容 API 的插件"),
    "use-map-color-cache": t("使用缓存来存储地图颜色")
  },
  "spawn-limits": {
    monsters: t("每个世界可以产生的怪物数量"),
    animals: t("每个世界可以产生的动物数量"),
    "water-animals": t("每个世界可以产生的水生动物的数量"),
    "water-ambient": "",
    ambient: t("可以按世界生成的周围生物（又名蝙蝠）的数量")
  },
  "chunk-gc": {
    "period-in-ticks": t("每个大区块垃圾回收之间的 Tick")
  },
  "ticks-per": {
    "animal-spawns": t(
      "每 Tick 尝试生成一次动物，值为 400 表示服务器将尝试在每 400 Ticks 尝试生成一次动物，值小于 0 将重置为 Minecraft 的默认值"
    ),
    "monster-spawns": t("每 Tick 尝试生成一次怪物，同上"),
    autosave: t(
      "自动保存，值 6000 表示服务器将尝试每 5 分钟自动保存一次世界。注: 过小可能会导致服务器卡顿"
    ),
    "water-spawns": "",
    "water-ambient-spawns": "",
    "ambient-spawns": ""
  },
  aliases: t("简化指令文件")
};

const parsedConfig = jsonToMap(props.config);
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
                "此配置文件为 Bukkit 类或其他衍生类服务端常见的配置文件，一般情况下，此配置文件无需过多修改，您可以根据翻译进行适当调节，但如果使用 Bukkit 衍生类服务端软件，可能这个配置文件将是无效的。"
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
        <div v-for="(item, index) in parsedConfig" :key="index">
          <LineOption :option-value="parsedConfig" :option-key="index">
            <template #title>{{ index }}</template>
            <template #info>{{ getDescriptionByTitle(description, index) }}</template>
          </LineOption>
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
