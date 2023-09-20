<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { LayoutCard } from "@/types";
import { arrayFilter } from "../../tools/array";
import { t } from "@/lang/i18n";
import { ArrowRightOutlined, CloudServerOutlined } from "@ant-design/icons-vue";
import InnerCard from "@/components/InnerCard.vue";
import { LayoutCardHeight } from "../../config/originLayoutConfig";
import { router } from "@/config/router";
import { useAppRouters } from "@/hooks/useAppRouters";
import { useLayoutCardTools } from "../../hooks/useCardTools";
import { useInstanceInfo } from "@/hooks/useInstance";
import TermConfig from "./dialogs/TermConfig.vue";
import EventConfig from "./dialogs/EventConfig.vue";
import PingConfig from "./dialogs/PingConfig.vue";
const terminalConfigDialog = ref<InstanceType<typeof TermConfig>>();
const eventConfigDialog = ref<InstanceType<typeof EventConfig>>();
const pingConfigDialog = ref<InstanceType<typeof PingConfig>>();
const { toPage } = useAppRouters();

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);

const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { statusText, isRunning, isStopped, instanceTypeText, instanceInfo, execute } =
  useInstanceInfo({
    instanceId,
    daemonId,
    autoRefresh: true
  });

onMounted(async () => {
  if (instanceId && daemonId) {
    await execute({
      params: {
        uuid: instanceId,
        remote_uuid: daemonId
      }
    });
  }
});

const btns = arrayFilter([
  {
    title: t("TXT_CODE_d07742fe"),
    icon: CloudServerOutlined,
    click: () => {
      toPage({
        path: "/instances/terminal/serverConfig",
        query: {
          type: "Minecraft"
        }
      });
    }
  },
  {
    title: t("TXT_CODE_ae533703"),
    icon: CloudServerOutlined,
    click: () => {
      toPage({ path: "/instances/terminal/files" });
    }
  },
  {
    title: t("TXT_CODE_d23631cb"),
    icon: CloudServerOutlined,
    click: () => {
      terminalConfigDialog.value?.openDialog();
    }
  },
  {
    title: t("TXT_CODE_b7d026f8"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    }
  },
  {
    title: t("TXT_CODE_3a406403"),
    icon: CloudServerOutlined,
    click: () => {
      pingConfigDialog.value?.openDialog();
    }
  },
  {
    title: t("TXT_CODE_d341127b"),
    icon: CloudServerOutlined,
    click: () => {
      eventConfigDialog.value?.openDialog();
    }
  },

  {
    title: t("TXT_CODE_4f34fc28"),
    icon: CloudServerOutlined,
    click: () => {
      console.log(1);
    }
  }
]);
</script>

<template>
  <CardPanel class="containerWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div class="pb-4">
        <a-row :gutter="[24, 24]" style="height: 100%">
          <a-col
            v-for="btn in btns"
            :key="btn.title"
            :span="24"
            :md="12"
            :lg="6"
            style="height: 100%"
          >
            <InnerCard :style="{ height: LayoutCardHeight.MINI }" @click="btn.click">
              <template #title>
                <component :is="btn.icon"></component>
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
  />

  <EventConfig
    ref="eventConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
  />

  <PingConfig
    ref="pingConfigDialog"
    :instance-info="instanceInfo"
    :instance-id="instanceId"
    :daemon-id="daemonId"
  />
</template>

<style lang="scss" scoped></style>
