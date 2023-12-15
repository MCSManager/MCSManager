<script setup lang="ts">
import { ref, computed } from "vue";
import type { LayoutCard } from "@/types";
import { arrayFilter } from "../../tools/array";
import { t } from "@/lang/i18n";
import {
  AppstoreAddOutlined,
  ArrowRightOutlined,
  CodeOutlined,
  ControlOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  FolderOpenOutlined
} from "@ant-design/icons-vue";
import InnerCard from "@/components/InnerCard.vue";
import { LayoutCardHeight } from "../../config/originLayoutConfig";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { useInstanceInfo } from "@/hooks/useInstance";
import TermConfig from "./dialogs/TermConfig.vue";
import EventConfig from "./dialogs/EventConfig.vue";
import PingConfig from "./dialogs/PingConfig.vue";
import InstanceDetails from "./dialogs/InstanceDetails.vue";
import { GLOBAL_INSTANCE_NAME } from "../../config/const";
import type { RouteLocationPathRaw } from "vue-router";
const terminalConfigDialog = ref<InstanceType<typeof TermConfig>>();
const eventConfigDialog = ref<InstanceType<typeof EventConfig>>();
const pingConfigDialog = ref<InstanceType<typeof PingConfig>>();
const instanceDetailsDialog = ref<InstanceType<typeof InstanceDetails>>();
const { toPage: toOtherPager } = useAppRouters();

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { instanceInfo, execute } = useInstanceInfo({
  instanceId,
  daemonId,
  autoRefresh: true
});

const toPage = (params: RouteLocationPathRaw) => {
  if (!params.query) params.query = {};
  params.query = {
    ...params.query,
    instanceId,
    daemonId
  };
  toOtherPager(params);
};

const refreshInstanceInfo = async () => {
  await execute({
    params: {
      uuid: instanceId ?? "",
      daemonId: daemonId ?? ""
    },
    forceRequest: true
  });
};

const isGlobalTerminal = computed(() => {
  return instanceInfo.value?.config.nickname === GLOBAL_INSTANCE_NAME;
});

const btns = computed(() =>
  arrayFilter([
    {
      title: t("TXT_CODE_d07742fe"),
      icon: ControlOutlined,
      condition: () => !isGlobalTerminal.value,
      click: (): void => {
        toPage({
          path: "/instances/terminal/serverConfig",
          query: {
            type: instanceInfo.value?.config.type
          }
        });
      }
    },
    {
      title: t("TXT_CODE_ae533703"),
      icon: FolderOpenOutlined,
      click: () => {
        toPage({ path: "/instances/terminal/files" });
      }
    },
    {
      title: t("TXT_CODE_d23631cb"),
      icon: CodeOutlined,
      click: () => {
        terminalConfigDialog.value?.openDialog();
      }
    },
    {
      title: t("TXT_CODE_b7d026f8"),
      icon: FieldTimeOutlined,
      condition: () => !isGlobalTerminal.value,
      click: () => {
        toPage({
          path: "/instances/schedule",
          query: {
            instanceId,
            daemonId
          }
        });
      }
    },

    // {
    //   title: t("TXT_CODE_3a406403"),
    //   icon: CloudServerOutlined,
    //   condition: () => !isGlobalTerminal.value,
    //   click: () => {
    //     pingConfigDialog.value?.openDialog();
    //   }
    // },
    {
      title: t("TXT_CODE_d341127b"),
      icon: DashboardOutlined,
      click: () => {
        eventConfigDialog.value?.openDialog();
      }
    },

    {
      title: t("TXT_CODE_4f34fc28"),
      icon: AppstoreAddOutlined,
      click: () => {
        instanceDetailsDialog.value?.openDialog();
      }
    }
  ])
);
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="pb-4">
        <a-row :gutter="[16, 16]" style="height: 100%">
          <a-col
            v-for="btn in btns"
            :key="btn.title"
            :span="24"
            :md="12"
            :lg="6"
            style="height: 100%"
          >
            <InnerCard
              :style="{ height: LayoutCardHeight.MINI }"
              :icon="btn.icon"
              @click="btn.click"
            >
              <template #title>
                {{ btn.title }}
              </template>
              <template #body>
                <a href="javascript:void(0);">
                  <span>
                    {{ t("TXT_CODE_6c5985ca") }}
                    <ArrowRightOutlined style="font-size: 12px" />
                  </span>
                </a>
              </template>
            </InnerCard>
          </a-col>
        </a-row>
      </div>
    </template>
  </CardPanel>

  <TermConfig
    ref="terminalConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <EventConfig
    ref="eventConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <PingConfig
    ref="pingConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />

  <InstanceDetails
    ref="instanceDetailsDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
    @update="refreshInstanceInfo"
  />
</template>

<style lang="scss" scoped></style>
