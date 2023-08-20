<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { DownOutlined, PlaySquareOutlined } from "@ant-design/icons-vue";
import { arrayFilter } from "../../tools/array";
import { useRoute } from "vue-router";

const props = defineProps<{
  card: LayoutCard;
}>();

// 如果 meta 参数包含数值，则应该使用 meta 传递而来的参数。
// 用户在新增卡片时会被要求补充 meta 参数。
// 这样的好处是可以实现卡片被放置在任意界面。
let { instanceId, daemonId } = props.card.meta ?? {};

// 如果 Meta 中不包含实例 ID 和节点 ID，那么就需要从路由中获取 route 上的参数
const route = useRoute();
if (!instanceId || !daemonId) {
  instanceId = route.query.instanceId ?? "";
  daemonId = route.query.daemonId ?? "";
}

const quickOperations = arrayFilter([
  // {
  //   title: t("开启程序"),
  //   icon: PlaySquareOutlined,
  //   click: () => {
  //     console.log(1);
  //   },
  //   props: {},
  // },
  {
    title: t("关闭程序"),
    icon: PlaySquareOutlined,
    click: () => {
      console.log(2);
    },
    props: {
      danger: true,
    },
  },
]);

const instanceOperations = arrayFilter([
  {
    title: t("重启"),
    icon: PlaySquareOutlined,
    click: () => {
      console.log(3);
    },
  },
  {
    title: t("更新"),
    icon: PlaySquareOutlined,
    click: () => {
      console.log(4);
    },
  },
]);
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #operator>
      <a-button
        class="mr-8"
        v-for="item in quickOperations"
        :key="item.title"
        v-bind="item.props"
      >
        {{ item.title }}
      </a-button>
      <a-dropdown>
        <template #overlay>
          <a-menu>
            <a-menu-item
              v-for="item in instanceOperations"
              :key="item.title"
              @click="item.click"
            >
              <component :is="item.icon"></component>
              <span>&nbsp;{{ item.title }}</span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button type="primary">
          操作
          <DownOutlined />
        </a-button>
      </a-dropdown>
    </template>
    <template #body>
      <p>控制台区域（TODO）</p>

      <p>实例ID: {{ instanceId }}</p>
      <p>守护进程ID: {{ daemonId }}</p>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.containerWrapper {
}
</style>
