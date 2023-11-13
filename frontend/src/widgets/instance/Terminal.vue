<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import {
  CloudDownloadOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReconciliationOutlined
} from "@ant-design/icons-vue";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { arrayFilter } from "../../tools/array";
import { useTerminal } from "../../hooks/useTerminal";
import { onMounted, computed, ref } from "vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getRandomId } from "../../tools/randId";
import IconBtn from "@/components/IconBtn.vue";
import { openInstance, stopInstance, restartInstance } from "@/services/apis/instance";
import { CloseOutlined } from "@ant-design/icons-vue";
import { GLOBAL_INSTANCE_NAME } from "../../config/const";
import { INSTANCE_STATUS_TEXT } from "../../hooks/useInstance";
import { message } from "ant-design-vue";
import connectErrorImage from "@/assets/daemon_connection_error.png";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";

const props = defineProps<{
  card: LayoutCard;
}>();

const { containerState } = useLayoutContainerStore();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const {
  execute,
  initTerminalWindow,
  sendCommand,
  state: instanceInfo,
  isRunning,
  isStopped,
  events,
  isConnect,
  socketAddress
} = useTerminal();

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const viewType = getMetaOrRouteValue("viewType", false);

const terminalDomId = computed(() => `terminal-window-${getRandomId()}`);

const commandInputValue = ref("");
const socketError = ref<Error>();

const instanceStatusText = computed(
  () => String(INSTANCE_STATUS_TEXT[String(instanceInfo?.value?.status)]) || t("TXT_CODE_c8333afa")
);

const quickOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_57245e94"),
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
      title: t("TXT_CODE_b1dedda3"),
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
    title: t("TXT_CODE_47dcfa5"),
    icon: ReconciliationOutlined,
    click: () => {
      restartInstance().execute({
        params: {
          uuid: instanceId || "",
          remote_uuid: daemonId || ""
        }
      });
    }
  },
  {
    title: t("TXT_CODE_7b67813a"),
    icon: CloseOutlined,
    click: () => {
      console.log(3);
    }
  },
  {
    title: t("TXT_CODE_40ca4f2"),
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
    return initTerminalWindow(dom);
  }
  throw new Error("init terminal failed");
};

const getInstanceName = computed(() => {
  if (instanceInfo.value?.config.nickname === GLOBAL_INSTANCE_NAME) {
    return t("节点终端");
  } else {
    return instanceInfo.value?.config.nickname;
  }
});

events.on("opened", () => {
  message.success(t("实例已运行"));
});

events.on("stopped", () => {
  message.success(t("实例已停止运行"));
});

events.on("error", (error: Error) => {
  socketError.value = error;
});

onMounted(async () => {
  try {
    if (instanceId && daemonId) {
      await execute({
        instanceId,
        daemonId
      });
    }
    initTerminal();
  } catch (error) {
    throw new Error(t("初始化终端失败，可能是远程节点或实例已不存在，请刷新网页重试。"));
  }
});

const innerTerminalType = viewType === "inner";
</script>

<template>
  <div v-if="socketError" class="error-card">
    <div class="error-card-container">
      <a-typography-title :level="5">{{ $t("无法连接到远程节点") }}</a-typography-title>
      <a-typography-paragraph>
        {{ $t("浏览器无法连接到地址：") + socketAddress }}
      </a-typography-paragraph>
      <div>
        <img :src="connectErrorImage" style="width: 100%" />
      </div>
      <a-typography-title :level="5">{{ $t("解决方案：") }}</a-typography-title>
      <a-typography-paragraph>
        <ul>
          <li>
            {{ $t("如果您只是一名普通用户，请联系面板管理员。") }}
          </li>
          <li>
            {{ $t("确保连接远程节点地址是公开IP，且节点端口正常开放。") }}
          </li>
          <li>
            {{ $t("配置 SSL，反向代理等，需要额外支持 Websocket 协议。") }}
          </li>
          <li>
            {{ $t("访问 https://docs.mcsmanager.com 了解更多。") }}
          </li>
        </ul>
      </a-typography-paragraph>
    </div>
  </div>
  <!-- Terminal Page View -->
  <div v-if="innerTerminalType">
    <div class="mb-24">
      <BetweenMenus>
        <template #left>
          <div class="align-center">
            <a-typography-title class="mb-0 mr-12" :level="4">
              <CloudServerOutlined />
              <span class="ml-8">
                {{ getInstanceName }}
              </span>
            </a-typography-title>
            <a-typography-paragraph class="mb-0">
              <span v-if="isRunning" class="color-success">
                <CheckCircleOutlined />
                {{ instanceStatusText }}
              </span>
              <span v-else-if="isStopped"></span>
              <span v-else>
                <ExclamationCircleOutlined />
                {{ instanceStatusText }}
              </span>
            </a-typography-paragraph>
          </div>
        </template>
        <template #right>
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item
                  v-for="item in [...quickOperations, ...instanceOperations]"
                  :key="item.title"
                  @click="item.click"
                >
                  <component :is="item.icon" />
                  {{ item.title }}
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="primary">
              {{ t("TXT_CODE_fe731dfc") }}
              <DownOutlined />
            </a-button>
          </a-dropdown>
        </template>
      </BetweenMenus>
    </div>
    <a-spin :spinning="!isConnect" tip="正在连接终端中...">
      <div v-if="!containerState.isDesignMode" class="console-wrapper">
        <div class="terminal-wrapper global-card-container-shadow">
          <div class="terminal-container">
            <div :id="terminalDomId"></div>
          </div>
        </div>
        <div class="command-input">
          <a-input
            v-model:value="commandInputValue"
            :placeholder="t('TXT_CODE_b8108d4d')"
            @press-enter="handleSendCommand"
          >
            <template #prefix>
              <CodeOutlined style="font-size: 18px" />
            </template>
          </a-input>
        </div>
      </div>
      <div v-else>
        <a-skeleton :paragraph="{ rows: 8 }" />
      </div>
    </a-spin>
  </div>

  <!-- Other Page View -->
  <CardPanel v-else class="containerWrapper" style="height: 100%">
    <template #title>
      <CloudServerOutlined />
      <span class="ml-8">
        {{ getInstanceName }}
      </span>
    </template>
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
          <IconBtn :icon="DownOutlined" :title="t('TXT_CODE_fe731dfc')"></IconBtn>
        </span>
      </a-dropdown>
    </template>
    <template #body>
      <div v-if="!containerState.isDesignMode" class="console-wrapper">
        <div class="terminal-wrapper">
          <div class="terminal-container">
            <div :id="terminalDomId"></div>
          </div>
        </div>
        <div class="command-input">
          <a-input
            v-model:value="commandInputValue"
            :placeholder="t('TXT_CODE_b8108d4d')"
            @press-enter="handleSendCommand"
          >
            <template #prefix>
              <CodeOutlined style="font-size: 18px" />
            </template>
          </a-input>
        </div>
      </div>
      <div v-else>
        <a-skeleton :paragraph="{ rows: 8 }" />
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.error-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  backdrop-filter: blur(1px);
  z-index: 10;
  border-radius: 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  .error-card-container {
    overflow: hidden;
    max-width: 500px;
    background-color: var(--color-gray-1);

    border-radius: 4px;
    padding: 12px;
  }
}
.console-wrapper {
  position: relative;

  .terminal-wrapper {
    position: relative;
    overflow: hidden;
    height: 100%;
    background-color: #1e1e1e;
    padding: 8px;
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
