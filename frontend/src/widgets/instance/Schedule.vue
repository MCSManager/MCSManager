<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { reportErrorMsg } from "@/tools/validator";
import { DeleteOutlined, FieldTimeOutlined } from "@ant-design/icons-vue";
import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useAppRouters } from "@/hooks/useAppRouters";
import { scheduleList, scheduleDelete } from "@/services/apis/instance";
import type { LayoutCard, Schedule } from "@/types/index";
import { ScheduleAction, ScheduleType, ScheduleCreateType } from "@/types/const";
import NewSchedule from "@/widgets/instance/dialogs/NewSchedule.vue";
import type { AntColumnsType } from "../../types/ant";
import { useScreen } from "@/hooks/useScreen";

const props = defineProps<{
  card: LayoutCard;
}>();

const { isPhone } = useScreen();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const { toPage } = useAppRouters();
const newScheduleDialog = ref<InstanceType<typeof NewSchedule>>();

const { state, execute, isLoading } = scheduleList();
const getScheduleList = async () => {
  try {
    await execute({
      params: {
        daemonId: daemonId ?? "",
        uuid: instanceId ?? ""
      }
    });
  } catch (err: any) {
    console.error(err);
    reportErrorMsg(err.message);
  }
};

const deleteSchedule = async (name: string) => {
  const { execute, state } = scheduleDelete();
  try {
    await execute({
      params: {
        daemonId: daemonId ?? "",
        uuid: instanceId ?? "",
        task_name: name
      }
    });
    if (state.value) {
      message.success(t("TXT_CODE_28190dbc"));
      await getScheduleList();
    }
  } catch (err: any) {
    console.error(err);
    reportErrorMsg(err.message);
  }
};

const rendTime = (text: string, schedule: Schedule) => {
  switch (schedule.type.toString()) {
    case ScheduleCreateType.INTERVAL: {
      const time = Number(text);
      let s = time;
      let m = 0;
      let h = 0;
      while (s >= 60) {
        s -= 60;
        m += 1;
      }
      while (m >= 60) {
        m -= 60;
        h += 1;
      }
      return `${t("TXT_CODE_ec6d29f4")} ${h} ${t("TXT_CODE_e3db239d")} ${m} ${t(
        "TXT_CODE_3b1bb444"
      )} ${s} ${t("TXT_CODE_acabc771")}`;
    }
    case ScheduleCreateType.CYCLE: {
      const time = text;
      const timeArr = time.split(" ");
      const h = timeArr[2];
      const m = timeArr[1];
      const s = timeArr[0];
      const w = timeArr[5];
      return `${t("TXT_CODE_76750199")} ${w} / ${h}:${m}:${s}`;
    }
    case ScheduleCreateType.SPECIFY: {
      const time = text;
      const timeArr = time.split(" ");
      const h = timeArr[2];
      const m = timeArr[1];
      const s = timeArr[0];
      const dd = timeArr[3];
      const mm = timeArr[4];
      return `${mm} ${t("TXT_CODE_6cb9bb04")} ${dd} ${t("TXT_CODE_ca923eba")} ${h}:${m}:${s}`;
    }
    default:
      return "Unknown Time";
  }
};

const columns: AntColumnsType[] = [
  {
    align: "center",
    title: t("TXT_CODE_2d542e4c"),
    dataIndex: "name",
    key: "name"
  },
  {
    align: "center",
    title: t("TXT_CODE_1544562"),
    dataIndex: "payload",
    key: "payload"
  },
  {
    align: "center",
    title: t("TXT_CODE_485e2d41"),
    dataIndex: "count",
    key: "count",
    minWidth: 80,
    customRender: (e: { text: number }) => (e.text > 0 ? e.text : t("TXT_CODE_a92df201"))
  },
  {
    align: "center",
    title: t("TXT_CODE_82fbc5ad"),
    dataIndex: "action",
    key: "action",
    minWidth: 180,
    customRender: (e: { text: "command" | "stop" | "start" | "restart" | "kill" }) =>
      ScheduleAction[e.text]
  },
  {
    align: "center",
    title: t("TXT_CODE_67d68dd1"),
    dataIndex: "type",
    key: "type",
    minWidth: 180,
    customRender: (e: { text: 1 | 2 | 3 }) => ScheduleType[e.text]
  },
  {
    align: "center",
    title: t("TXT_CODE_3554dac0"),
    dataIndex: "time",
    key: "time",
    minWidth: 240,
    customRender: (e: { text: string; record: Schedule }) => rendTime(e.text, e.record)
  },
  {
    align: "center",
    title: t("TXT_CODE_fe731dfc"),
    key: "actions",
    minWidth: 180
  }
];

const refresh = async () => {
  await getScheduleList();
  message.success(t("TXT_CODE_fbde647e"));
};

const toConsole = () => {
  toPage({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
    }
  });
};

onMounted(async () => {
  getScheduleList();
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              <FieldTimeOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button @click="toConsole">
              {{ t("TXT_CODE_c14b2ea3") }}
            </a-button>
            <a-button @click="refresh">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
            <a-button type="primary" @click="newScheduleDialog?.openDialog()">
              {{ t("TXT_CODE_1644b775") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>
      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-spin :spinning="isLoading">
              <a-table
                :data-source="state"
                :columns="columns"
                :scroll="{ x: 'max-content' }"
                :pagination="{
                  pageSize: 15
                }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'actions'">
                    <a-popconfirm
                      :title="t('TXT_CODE_6ff0668f')"
                      @confirm="deleteSchedule(record.name)"
                    >
                      <a-button size="large">
                        {{ t("TXT_CODE_ecbd7449") }}
                        <DeleteOutlined />
                      </a-button>
                    </a-popconfirm>
                  </template>
                </template>
              </a-table>
            </a-spin>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>

  <NewSchedule
    ref="newScheduleDialog"
    :daemon-id="daemonId ?? ''"
    :instance-id="instanceId ?? ''"
    @get-schedule-list="getScheduleList()"
  />
</template>

<style lang="scss" scoped>
.search-input {
  transition: all 0.4s;
  text-align: center;
  width: 50%;

  &:hover {
    width: 100%;
  }

  @media (max-width: 992px) {
    width: 100% !important;
  }
}
</style>
