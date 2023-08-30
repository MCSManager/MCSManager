<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import { DownOutlined, PlaySquareOutlined } from "@ant-design/icons-vue";
import { arrayFilter } from "../../tools/array";
import { useRoute } from "vue-router";
import { useTerminal } from "../../hooks/useTerminal";
import { onMounted } from "vue";
import type { InstanceDetail } from "../../types/index";
import { useLayoutCardTools } from "@/hooks/useCardTools";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue<string>("instanceId");
const daemonId = getMetaOrRouteValue<string>("daemonId");

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
      danger: true
    }
  }
]);

const instanceOperations = arrayFilter([
  {
    title: t("重启"),
    icon: PlaySquareOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("更新"),
    icon: PlaySquareOutlined,
    click: () => {
      console.log(4);
    }
  }
]);

const { execute, events, state } = useTerminal();

events.on("stdout", (v: InstanceDetail) => {
  console.debug("stdout:", v);
});

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      instanceId,
      daemonId
    });
  }
});
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #operator>
      <a-button
        v-for="item in quickOperations"
        :key="item.title"
        size="default"
        class="mr-8"
        v-bind="item.props"
      >
        {{ item.title }}
      </a-button>
      <a-dropdown>
        <template #overlay>
          <a-menu>
            <a-menu-item v-for="item in instanceOperations" :key="item.title" @click="item.click">
              <component :is="item.icon"></component>
              <span>&nbsp;{{ item.title }}</span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button size="default" type="primary">
          操作
          <DownOutlined />
        </a-button>
      </a-dropdown>
    </template>
    <template #body>
      <p>控制台区域（TODO）</p>

      <p>实例ID: {{ instanceId }}</p>
      <p>守护进程ID: {{ daemonId }}</p>

      <p>
        {{ state }}
      </p>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped></style>
