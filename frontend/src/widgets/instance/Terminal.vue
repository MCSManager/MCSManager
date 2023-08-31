<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import {
  CloudDownloadOutlined,
  CodeOutlined,
  DownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReconciliationOutlined
} from "@ant-design/icons-vue";
import { arrayFilter } from "../../tools/array";
import { useTerminal } from "../../hooks/useTerminal";
import { onMounted, computed, ref } from "vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getRandomId } from "../../tools/randId";
import IconBtn from "@/components/IconBtn.vue";
import { openInstance, stopInstance } from "@/services/apis/instance";
import { CloseOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { execute, initTerminalWindow, sendCommand } = useTerminal();

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const terminalDomId = computed(() => `terminal-window-${getRandomId()}`);
const commandInputValue = ref("");

const quickOperations = computed(() =>
  arrayFilter([
    {
      title: t("开启程序"),
      icon: PlayCircleOutlined,
      click: () => {
        openInstance().execute({
          params: {
            uuid: instanceId || "",
            remote_uuid: daemonId || ""
          }
        });
      },
      props: {}
    },
    {
      title: t("关闭程序"),
      icon: PauseCircleOutlined,
      click: () => {
        stopInstance().execute({
          params: {
            uuid: instanceId || "",
            remote_uuid: daemonId || ""
          }
        });
      },
      props: {
        danger: true
      }
    }
  ])
);

const instanceOperations = arrayFilter([
  {
    title: t("重启"),
    icon: ReconciliationOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("终止"),
    icon: CloseOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("更新"),
    icon: CloudDownloadOutlined,
    click: () => {
      console.log(4);
    }
  }
]);

const handleSendCommand = () => {
  sendCommand(commandInputValue.value);
  commandInputValue.value = "";
};

const initTerminal = () => {
  const dom = document.getElementById(terminalDomId.value);
  if (dom) {
    initTerminalWindow(dom);
  }
  throw new Error("init terminal failed");
};

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      instanceId,
      daemonId
    });
  }
  initTerminal();
});
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #operator>
      <span
        v-for="item in quickOperations"
        :key="item.title"
        size="default"
        class="mr-2"
        v-bind="item.props"
      >
        <IconBtn :icon="item.icon" :title="item.title" @click="item.click"></IconBtn>
      </span>
      <a-dropdown>
        <template #overlay>
          <a-menu>
            <a-menu-item v-for="item in instanceOperations" :key="item.title" @click="item.click">
              <component :is="item.icon"></component>
              <span>&nbsp;{{ item.title }}</span>
            </a-menu-item>
          </a-menu>
        </template>
        <span size="default" type="primary">
          <IconBtn :icon="DownOutlined" :title="t('操作')"></IconBtn>
        </span>
      </a-dropdown>
    </template>
    <template #body>
      <div class="console-wrapper">
        <div class="terminal-wrapper">
          <div class="terminal-container">
            <div :id="terminalDomId"></div>
          </div>
        </div>
        <div class="command-input">
          <a-input
            v-model:value="commandInputValue"
            :placeholder="t('在这里输入命令按回车键发送')"
            @press-enter="handleSendCommand"
          >
            <template #prefix>
              <CodeOutlined style="font-size: 18px" />
            </template>
          </a-input>
        </div>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.console-wrapper {
  .terminal-wrapper {
    position: relative;
    overflow: hidden;
    height: 100%;
    background-color: #1e1e1e;
    padding: 4px;
    border-radius: 6px;
    overflow-x: auto !important;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
    .terminal-container {
      min-width: 680px;
      height: 100%;
    }

    margin-bottom: 12px;
  }

  .command-input {
    position: relative;
  }
}
</style>
