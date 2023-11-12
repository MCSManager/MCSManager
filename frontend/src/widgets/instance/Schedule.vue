<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { DeleteOutlined, FieldTimeOutlined } from "@ant-design/icons-vue";
import { throttle } from "lodash";
import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useScreen } from "@/hooks/useScreen";
import { useAppRouters } from "@/hooks/useAppRouters";
import { scheduleList, scheduleDelete } from "@/services/apis/instance";
import type { LayoutCard, Schedule } from "@/types/index";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");
const { toPage } = useAppRouters();
const screen = useScreen();

const { state, execute, isLoading } = scheduleList();
const getScheduleList = async () => {
  try {
    await execute({
      params: {
        remote_uuid: daemonId ?? "",
        uuid: instanceId ?? ""
      }
    });
  } catch (err: any) {
    console.error(err);
    message.error(err.message);
  }
};

const deleteSchedule = async (name: string) => {
  const { execute, state } = scheduleDelete();
  try {
    await execute({
      params: {
        remote_uuid: daemonId ?? "",
        uuid: instanceId ?? "",
        task_name: name
      }
    });
    if (state.value) {
      message.success(t("删除成功"));
      refresh();
    }
  } catch (err: any) {
    console.error(err);
    message.error(err.message);
  }
};

const action = {
  command: t("发送命令"),
  stop: t("停止实例"),
  start: t("开启实例"),
  restart: t("重启实例"),
  kill: t("终止实例")
};

const type = {
  1: t("间隔时间性任务"),
  2: t("周期时间性任务"),
  3: t("指定时间性任务")
};

const rendTime = (text: string, schedule: Schedule) => {
  switch (schedule.type) {
    case 1: {
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
      return `${t("每隔")} ${h} ${t("小时")} ${m} ${t("分钟")} ${s} ${t("秒")}`;
    }
    case 2: {
      const time = text;
      const timeArr = time.split(" ");
      const h = timeArr[2];
      const m = timeArr[1];
      const s = timeArr[0];
      const w = timeArr[5];
      return `${t("每星期")} ${w} ${t("的")} ${h}:${m}:${s}`;
    }
    case 3: {
      const time = text;
      const timeArr = time.split(" ");
      const h = timeArr[2];
      const m = timeArr[1];
      const s = timeArr[0];
      const dd = timeArr[3];
      const mm = timeArr[4];
      return `${mm} ${t("每隔")} ${dd} ${t("每隔")} ${h}:${m}:${s}`;
    }
    default:
      return "Unknown Time";
  }
};

const columns = [
  {
    align: "center",
    title: t("任务名"),
    dataIndex: "name",
    key: "name"
  },
  {
    align: "center",
    title: t("有效载荷"),
    dataIndex: "payload",
    key: "payload"
  },
  {
    align: "center",
    title: t("剩余次数"),
    dataIndex: "count",
    key: "count",
    minWidth: "80px",
    customRender: (e: { text: number }) => {
      return e.text > 0 ? e.text : t("无限");
    }
  },
  {
    align: "center",
    title: t("动作"),
    dataIndex: "action",
    key: "action",
    minWidth: "180px",
    customRender: (e: { text: "command" | "stop" | "start" | "restart" | "kill" }) => {
      return action[e.text];
    }
  },
  {
    align: "center",
    title: t("类型"),
    dataIndex: "type",
    key: "type",
    minWidth: "180px",
    customRender: (e: { text: 1 | 2 | 3 }) => {
      return type[e.text];
    }
  },
  {
    align: "center",
    title: t("触发时间"),
    dataIndex: "time",
    key: "time",
    minWidth: "240px",
    customRender: (e: { text: string; record: Schedule }) => rendTime(e.text, e.record)
  },
  {
    align: "center",
    title: t("TXT_CODE_fe731dfc"),
    key: "actions",
    minWidth: "180px"
  }
];

const refresh = throttle(() => {
  getScheduleList();
}, 600);

onMounted(async () => {
  getScheduleList();
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              <FieldTimeOutlined />
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button class="mr-10">
              {{ t("返回控制台") }}
            </a-button>
            <a-button class="mr-10" @click="refresh">
              {{ t("刷新") }}
            </a-button>
            <a-button type="primary">
              {{ t("新增计划任务") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>
      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-spin :spinning="isLoading">
              <a-table :data-source="state" :columns="columns" :scroll="{ x: 'max-content' }">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'actions'">
                    <a-popconfirm
                      :title="t('你确定要删除这条计划任务吗?')"
                      @confirm="deleteSchedule(record.name)"
                    >
                      <a-button size="">
                        {{ t("删除") }}
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
