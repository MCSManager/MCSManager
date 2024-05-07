<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import CardPanel from "@/components/CardPanel.vue";
import { t } from "@/lang/i18n";
import type { LayoutCard } from "@/types";
import {
  CloudDownloadOutlined,
  CloudServerOutlined,
  DownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  LaptopOutlined,
  InteractionOutlined,
  LoadingOutlined
} from "@ant-design/icons-vue";
import { CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons-vue";
import { arrayFilter } from "../../tools/array";
import { useTerminal } from "../../hooks/useTerminal";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useScreen } from "@/hooks/useScreen";
import IconBtn from "@/components/IconBtn.vue";
import {
  openInstance,
  stopInstance,
  restartInstance,
  killInstance,
  updateInstance
} from "@/services/apis/instance";
import { CloseOutlined } from "@ant-design/icons-vue";
import { GLOBAL_INSTANCE_NAME } from "../../config/const";
import { INSTANCE_STATUS } from "@/types/const";
import { reportErrorMsg } from "@/tools/validator";
import TerminalCore from "@/components/TerminalCore.vue";
import Reinstall from "./dialogs/Reinstall.vue";
import { useAppStateStore } from "@/stores/useAppStateStore";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const { state, isAdmin } = useAppStateStore();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const { execute, state: instanceInfo, isStopped, isRunning, isBuys } = useTerminal();
const reinstallDialog = ref<InstanceType<typeof Reinstall>>();

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const viewType = getMetaOrRouteValue("viewType", false);
const innerTerminalType = viewType === "inner";
const updateCmd = computed(() => (instanceInfo.value?.config.updateCommand ? true : false));

const instanceStatusText = computed(() => INSTANCE_STATUS[instanceInfo.value?.status ?? -1]);
const quickOperations = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_57245e94"),
      icon: PlayCircleOutlined,
      noConfirm: false,
      type: "default",
      click: async () => {
        try {
          await openInstance().execute({
            params: {
              uuid: instanceId || "",
              daemonId: daemonId || ""
            }
          });
        } catch (error: any) {
          reportErrorMsg(error);
        }
      },
      props: {},
      condition: () => isStopped.value
    },
    {
      title: t("TXT_CODE_b1dedda3"),
      icon: PauseCircleOutlined,
      type: "default",
      click: async () => {
        try {
          await stopInstance().execute({
            params: {
              uuid: instanceId || "",
              daemonId: daemonId || ""
            }
          });
        } catch (error: any) {
          reportErrorMsg(error);
        }
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
      type: "default",
      noConfirm: false,
      click: async () => {
        try {
          await restartInstance().execute({
            params: {
              uuid: instanceId || "",
              daemonId: daemonId || ""
            }
          });
        } catch (error: any) {
          reportErrorMsg(error);
        }
      },
      condition: () => isRunning.value
    },
    {
      title: t("TXT_CODE_7b67813a"),
      icon: CloseOutlined,
      type: "danger",
      click: async () => {
        try {
          await killInstance().execute({
            params: {
              uuid: instanceId || "",
              daemonId: daemonId || ""
            }
          });
        } catch (error: any) {
          reportErrorMsg(error);
        }
      },
      condition: () => !isStopped.value
    },
    {
      title: t("TXT_CODE_40ca4f2"),
      type: "default",
      icon: CloudDownloadOutlined,
      click: async () => {
        try {
          await updateInstance().execute({
            params: {
              uuid: instanceId || "",
              daemonId: daemonId || "",
              task_name: "update"
            },
            data: {
              time: new Date().getTime()
            }
          });
        } catch (error: any) {
          reportErrorMsg(error);
        }
      },
      condition: () => isStopped.value && updateCmd.value
    },
    {
      title: t("TXT_CODE_b19ed1dd"),
      icon: InteractionOutlined,
      noConfirm: true,
      click: () => reinstallDialog.value?.openDialog(),
      props: {},
      condition: () => isStopped.value && (state.settings.allowUsePreset || isAdmin.value)
    }
  ])
);

const getInstanceName = computed(() => {
  if (instanceInfo.value?.config.nickname === GLOBAL_INSTANCE_NAME) {
    return t("TXT_CODE_5bdaf23d");
  } else {
    return instanceInfo.value?.config.nickname;
  }
});

onMounted(async () => {
  try {
    if (instanceId && daemonId) {
      await execute({
        instanceId,
        daemonId
      });
    }
  } catch (error: any) {
    console.error(error);
    throw error;
  }
});
</script>

<template>
  <!-- Terminal Page View -->
  <div v-if="innerTerminalType">
    <div class="mb-24">
      <BetweenMenus>
        <template #left>
          <div class="align-center">
            <a-typography-title class="mb-0 mr-12" :level="4">
              <CloudServerOutlined />
              <span class="ml-6"> {{ getInstanceName }} </span>
            </a-typography-title>
            <a-typography-paragraph v-if="!isPhone" class="mb-0 ml-4">
              <span v-if="isRunning" class="color-success">
                <CheckCircleOutlined />
                {{ instanceStatusText }}
              </span>
              <span v-else-if="isBuys">
                <LoadingOutlined />
                {{ instanceStatusText }}
              </span>
              <span v-else class="color-info">
                <InfoCircleOutlined />
                {{ instanceStatusText }}
              </span>

              <span
                v-if="instanceInfo?.watcher && instanceInfo?.watcher > 1 && !isPhone"
                class="ml-16"
              >
                <a-tooltip>
                  <template #title>
                    {{ $t("TXT_CODE_4a37ec9c") }}
                  </template>
                  <LaptopOutlined />
                </a-tooltip>
                <span class="ml-6" style="opacity: 0.8">
                  {{ instanceInfo?.watcher }}
                </span>
              </span>
            </a-typography-paragraph>
          </div>
        </template>
        <template #right>
          <div v-if="!isPhone">
            <template v-for="item in [...quickOperations, ...instanceOperations]" :key="item.title">
              <a-button
                v-if="item.noConfirm"
                class="ml-8"
                :danger="item.type === 'danger'"
                @click="item.click"
              >
                <component :is="item.icon" />
                {{ item.title }}
              </a-button>
              <a-popconfirm
                v-else
                :key="item.title"
                :title="t('TXT_CODE_276756b2')"
                @confirm="item.click"
              >
                <a-button class="ml-8" :danger="item.type === 'danger'">
                  <component :is="item.icon" />
                  {{ item.title }}
                </a-button>
              </a-popconfirm>
            </template>
          </div>

          <a-dropdown v-else>
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
    <TerminalCore
      v-if="instanceId && daemonId"
      :instance-id="instanceId"
      :daemon-id="daemonId"
      :height="card.height"
    />
  </div>

  <!-- Other Page View -->
  <CardPanel v-else class="containerWrapper" style="height: 100%">
    <template #title>
      <CloudServerOutlined />
      <span class="ml-8"> {{ getInstanceName }} </span>
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
      <TerminalCore
        v-if="instanceId && daemonId"
        :instance-id="instanceId"
        :daemon-id="daemonId"
        :height="card.height"
      />
    </template>
  </CardPanel>

  <Reinstall ref="reinstallDialog" :daemon-id="daemonId ?? ''" :instance-id="instanceId ?? ''" />
</template>

<style lang="scss" scoped>
.error-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
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

  .terminal-loading {
    z-index: 12;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .terminal-wrapper {
    border: 1px solid var(--card-border-color);
    position: relative;
    overflow: hidden;
    height: 100%;
    background-color: #1e1e1e;
    padding: 8px;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .terminal-container {
      // min-width: 1200px;
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
