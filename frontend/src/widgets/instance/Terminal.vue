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
  RedoOutlined,
  DeleteOutlined
} from "@ant-design/icons-vue";
import { CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { arrayFilter } from "../../tools/array";
import { useTerminal } from "../../hooks/useTerminal";
import { onMounted, computed, ref } from "vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getRandomId } from "../../tools/randId";
import IconBtn from "@/components/IconBtn.vue";
import {
  openInstance,
  stopInstance,
  restartInstance,
  killInstance,
  updateInstance,
  getInstanceOutputLog
} from "@/services/apis/instance";
import { CloseOutlined } from "@ant-design/icons-vue";
import { GLOBAL_INSTANCE_NAME } from "../../config/const";
import { INSTANCE_STATUS } from "@/types/const";
import { message } from "ant-design-vue";
import connectErrorImage from "@/assets/daemon_connection_error.png";
import { Terminal } from "xterm";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const {
  execute,
  initTerminalWindow,
  sendCommand,
  handleHistorySelect,
  clickHistoryItem,
  history,
  selectLocation,
  commandInputValue,
  focusHistoryList,
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
const updateCmd = computed(() => (instanceInfo.value?.config.updateCommand ? true : false));

const innerTerminalType = viewType === "inner";
const terminalDomId = `terminal-window-${getRandomId()}`;

const socketError = ref<Error>();

const instanceStatusText = computed(
  () => String(INSTANCE_STATUS[String(instanceInfo?.value?.status)]) || t("TXT_CODE_c8333afa")
);

let term: Terminal | null = null;

let inputRef = ref<HTMLElement | null>(null);

const quickOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_57245e94"),
      icon: PlayCircleOutlined,
      click: () => {
        openInstance().execute({
          params: {
            uuid: instanceId || "",
            daemonId: daemonId || ""
          }
        });
      },
      props: {},
      condition: () => isStopped.value
    },
    {
      title: t("TXT_CODE_b1dedda3"),
      icon: PauseCircleOutlined,
      click: () => {
        stopInstance().execute({
          params: {
            uuid: instanceId || "",
            daemonId: daemonId || ""
          }
        });
      },
      props: {
        danger: true
      },
      condition: () => isRunning.value
    }
  ])
);

const instanceOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_47dcfa5"),
      icon: RedoOutlined,
      click: () => {
        restartInstance().execute({
          params: {
            uuid: instanceId || "",
            daemonId: daemonId || ""
          }
        });
      },
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_7b67813a"),
      icon: CloseOutlined,
      click: () => {
        killInstance().execute({
          params: {
            uuid: instanceId || "",
            daemonId: daemonId || ""
          }
        });
      },
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_40ca4f2"),
      icon: CloudDownloadOutlined,
      click: () => {
        updateInstance().execute({
          params: {
            uuid: instanceId || "",
            daemonId: daemonId || "",
            task_name: "update"
          },
          data: {
            time: new Date().getTime()
          }
        });
      },
      condition: () => isStopped.value && updateCmd.value
    }
  ])
);

const handleSendCommand = () => {
  if (focusHistoryList.value) return;
  sendCommand(commandInputValue.value || "");
  commandInputValue.value = "";
};

const handleClickHistoryItem = (item: string) => {
  clickHistoryItem(item);
  inputRef.value?.focus();
};

const initTerminal = async () => {
  const dom = document.getElementById(terminalDomId);
  if (dom) {
    const term = initTerminalWindow(dom);
    try {
      const { value } = await getInstanceOutputLog().execute({
        params: { uuid: instanceId || "", daemonId: daemonId || "" }
      });
      if (value) term.write(value);
    } catch (error) {}
    return term;
  }
  throw new Error("init terminal failed");
};

const getInstanceName = computed(() => {
  if (instanceInfo.value?.config.nickname === GLOBAL_INSTANCE_NAME) {
    return t("TXT_CODE_5bdaf23d");
  } else {
    return instanceInfo.value?.config.nickname;
  }
});

events.on("opened", () => {
  message.success(t("TXT_CODE_e13abbb1"));
});

events.on("stopped", () => {
  message.success(t("TXT_CODE_efb6d377"));
});

events.on("error", (error: Error) => {
  socketError.value = error;
});

const clearTerminal = () => {
  term?.clear();
};

const refreshPage = () => {
  window.location.reload();
};

onMounted(async () => {
  try {
    if (instanceId && daemonId) {
      await execute({
        instanceId,
        daemonId
      });
    }
    term = await initTerminal();
  } catch (error) {
    console.error(error);
    throw error;
    // throw new Error(t("TXT_CODE_9885543f"));
  }
});
</script>

<template>
  <div v-if="socketError" class="error-card">
    <div class="error-card-container">
      <a-typography-title :level="5">{{ $t("TXT_CODE_6929b0b2") }}</a-typography-title>
      <a-typography-paragraph>
        {{ $t("TXT_CODE_812a629e") + socketAddress }}
      </a-typography-paragraph>
      <div>
        <img :src="connectErrorImage" style="width: 100%; height: 110px" />
      </div>
      <a-typography-title :level="5">{{ $t("TXT_CODE_9c95b60f") }}</a-typography-title>
      <a-typography-paragraph>
        <pre style="font-size: 12px"><code>{{ socketError.message }}</code></pre>
      </a-typography-paragraph>
      <a-typography-title :level="5">{{ $t("TXT_CODE_f1c96d8a") }}</a-typography-title>
      <a-typography-paragraph>
        <ul>
          <li>
            {{ $t("TXT_CODE_ceba9262") }}
          </li>
          <li>
            {{ $t("TXT_CODE_84099e5") }}
          </li>
          <li>
            {{ $t("TXT_CODE_86ff658a") }}
          </li>
          <li>
            {{ $t("TXT_CODE_9c188ec8") }}
          </li>
        </ul>
        <div class="flex flex-center">
          <a-typography-link @click="refreshPage">{{ $t("TXT_CODE_f8b28901") }}</a-typography-link>
        </div>
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
    <a-spin :spinning="!isConnect" :tip="t('TXT_CODE_686c9ca9')">
      <div class="console-wrapper">
        <div class="terminal-button-group position-absolute-right position-absolute-top">
          <ul>
            <li @click="clearTerminal()">
              <a-tooltip placement="top">
                <template #title>
                  <span>{{ t("TXT_CODE_b1e2e1b4") }}</span>
                </template>
                <delete-outlined />
              </a-tooltip>
            </li>
          </ul>
        </div>
        <div class="terminal-wrapper global-card-container-shadow position-relative">
          <div class="terminal-container">
            <div :id="terminalDomId" :style="{ height: card.height }"></div>
          </div>
        </div>
        <div class="command-input">
          <div v-show="focusHistoryList" class="history">
            <li v-for="(item, key) in history" :key="item">
              <a-tag
                v-if="key !== selectLocation"
                color="blue"
                @click="handleClickHistoryItem(item)"
              >
                {{ item }}
              </a-tag>
              <a-tag
                v-else
                id="Terminal-History-Select-Item"
                color="#108ee9"
                @click="handleClickHistoryItem(item)"
              >
                {{ item }}
              </a-tag>
            </li>
          </div>
          <a-input
            ref="inputRef"
            v-model:value="commandInputValue"
            :placeholder="t('在这里输入命令按回车发送 使用上下键选择历史命令')"
            autofocus
            @press-enter="handleSendCommand"
            @keydown="handleHistorySelect"
          >
            <template #prefix>
              <CodeOutlined style="font-size: 18px" />
            </template>
          </a-input>
        </div>
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
      <div class="console-wrapper">
        <div class="terminal-wrapper">
          <div class="terminal-container">
            <div :id="terminalDomId" :style="{ height: card.height }"></div>
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
    max-width: 440px;
    border: 1px solid var(--color-gray-6) !important;
    background-color: var(--color-gray-1);
    border-radius: 4px;
    padding: 12px;
    box-shadow: 0px 0px 2px var(--color-gray-7);
  }

  @media (max-width: 992px) {
    .error-card-container {
      max-width: 90vw !important;
    }
  }
}
.console-wrapper {
  position: relative;

  .terminal-button-group {
    z-index: 11;
    padding-bottom: 50px;
    padding-left: 50px;
    border-radius: 6px;
    color: #fff;

    &:hover {
      ul {
        transition: all 1s;
        opacity: 0.8;
      }
    }

    ul {
      display: flex;
      opacity: 0;

      li {
        cursor: pointer;
        list-style: none;
        padding: 5px;
        margin-left: 5px;
        border-radius: 6px;
        // background-color: #111111;
        font-size: 20px;
        &:hover {
          background-color: #3e3e3e;
        }
      }
    }
  }

  .terminal-wrapper {
    border: 1px solid var(--card-border-color);
    position: relative;
    overflow: hidden;
    height: 100%;
    background-color: #1e1e1e;
    padding: 8px;
    border-radius: 6px;
    overflow-x: auto !important;
    // overflow-y: auto !important;
    display: flex;
    flex-direction: column;
    .terminal-container {
      min-width: 1200px;
      height: 100%;
    }

    margin-bottom: 12px;
  }

  .command-input {
    position: relative;

    .history {
      display: flex;
      max-width: 100%;
      overflow: scroll;
      z-index: 10;
      position: absolute;
      top: -35px;
      left: 0;
      // background-color: pink;

      li {
        list-style: none;
        span {
          padding: 3px 20px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
      }

      &::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
      }
    }
  }
}
</style>
