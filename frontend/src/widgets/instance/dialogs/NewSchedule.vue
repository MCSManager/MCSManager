<script setup lang="ts">
import { ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import { message, notification } from "ant-design-vue";
import { ScheduleAction, ScheduleType } from "@/types/const";
import type { NewScheduleTask } from "@/types";
import { scheduleCreate } from "@/services/apis/instance";
import { useScreen } from "@/hooks/useScreen";
import type { Dayjs } from "dayjs";
import _ from "lodash";

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();
const emit = defineEmits(["getScheduleList"]);
const open = ref(false);
const openDialog = () => {
  open.value = true;
};
const { isPhone } = useScreen();

const weeks = [
  { label: t("周一"), value: 1 },
  { label: t("周二"), value: 2 },
  { label: t("周三"), value: 3 },
  { label: t("周四"), value: 4 },
  { label: t("周五"), value: 5 },
  { label: t("周六"), value: 6 },
  { label: t("周日"), value: 7 }
];

enum TYPE {
  INTERVAL = "1",
  CYCLE = "2",
  SPECIFY = "3"
}

interface NewTask extends NewScheduleTask {
  payload: string;
  weekend: string[];
  cycle: string[];
  objTime: string;
}

const newTaskOrigin = reactive<NewTask>({
  name: "",
  action: "command",
  count: "",
  type: TYPE.INTERVAL,
  time: "",
  payload: "",
  weekend: [],
  cycle: ["0", "0", "0"],
  objTime: ""
});

let newTask = reactive(_.cloneDeep(newTaskOrigin));

const createTaskTypeInterval = async () => {
  const arr = newTask.cycle;
  let ps = Number(arr[0]);
  let pm = Number(arr[1]);
  let ph = Number(arr[2]);
  const rs = ps + pm * 60 + ph * 60 * 60;
  newTask.time = rs.toString();
  await createRequest();
};

const createTaskTypeCycle = async () => {
  const weekend = newTask.weekend;
  if (newTask.objTime === "") throw new Error(t("请选择时间"));
  if (weekend.length === 0) throw new Error(t("请选择星期"));
  const time = new Date(newTask.objTime);
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  newTask.time = `${s} ${m} ${h} * * ${weekend.join(",")}`;
  await createRequest();
};

const createTaskTypeSpecify = async () => {
  if (newTask.objTime === "") throw new Error(t("请选择时间"));
  const time = newTask.objTime as unknown as Dayjs;
  const mm = time.month() + 1;
  const dd = time.date();
  const h = time.hour();
  const m = time.minute();
  const s = time.second();
  newTask.time = `${s} ${m} ${h} ${dd} ${mm} *`;
  await createRequest();
};

const { state, isLoading, execute } = scheduleCreate();
const createRequest = async () => {
  try {
    if (!newTask.count) newTask.count = "-1";
    await execute({
      params: {
        remote_uuid: props.daemonId,
        uuid: props.instanceId
      },
      data: newTask
    });
    if (state.value) {
      emit("getScheduleList");
      notification.success({
        message: t("创建成功")
      });
      newTask = reactive(_.cloneDeep(newTaskOrigin));
      open.value = false;
    }
  } catch (err: any) {
    console.error(err);
    message.error(err.message);
  }
};

const submit = async () => {
  try {
    if (newTask.type === TYPE.INTERVAL) await createTaskTypeInterval();
    if (newTask.type === TYPE.CYCLE) await createTaskTypeCycle();
    if (newTask.type === TYPE.SPECIFY) await createTaskTypeSpecify();
  } catch (err: any) {
    return message.error(err.message);
  }
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    :mask-closable="false"
    :title="t('新增计划任务')"
    :confirm-loading="isLoading"
    :destroy-on-close="true"
    :ok-text="t('保存')"
    @ok="submit"
  >
    <a-form-item>
      <a-typography-title :level="5">{{ t("计划任务名字") }}</a-typography-title>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("必填，且必须唯一") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-input v-model:value="newTask.name" />
    </a-form-item>

    <a-form-item>
      <a-typography-title :level="5">{{ t("任务动作 / 类型") }}</a-typography-title>
      <a-row :gutter="20">
        <a-col :xs="24" :md="12" :offset="0" :class="{ 'mb-10': isPhone }">
          <a-select
            v-model:value="newTask.action"
            :placeholder="t('请选择')"
            :dropdown-match-select-width="false"
          >
            <a-select-option v-for="(action, i) in ScheduleAction" :key="i" :value="i">
              {{ action }}
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :xs="24" :md="12" :offset="0">
          <a-select
            v-model:value="newTask.type"
            :placeholder="t('请选择')"
            :dropdown-match-select-width="false"
          >
            <a-select-option v-for="(type, i) in ScheduleType" :key="i" :value="i">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-col>
      </a-row>
    </a-form-item>

    <a-form-item v-if="newTask.type === TYPE.INTERVAL">
      <a-typography-paragraph>
        <a-typography-text>
          {{ t("每隔一定时间将执行一次，具体间隔可以仔细设置") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-row :gutter="20">
        <a-col :xs="24" :md="6" :offset="0" :class="{ 'mb-10': isPhone }">
          <a-input
            v-model:value="newTask.cycle[2]"
            :placeholder="t('不可为空，请写 0 代表每隔 0 时')"
            :addon-after="t('时')"
          />
        </a-col>
        <a-col :xs="24" :md="6" :offset="0" :class="{ 'mb-10': isPhone }">
          <a-input
            v-model:value="newTask.cycle[1]"
            :placeholder="t('不可为空，请写 0 代表每隔 0 时')"
            :addon-after="t('分')"
          />
        </a-col>
        <a-col :xs="24" :md="6" :offset="0" :class="{ 'mb-10': isPhone }">
          <a-input
            v-model:value="newTask.cycle[0]"
            :placeholder="t('不可为空，请写 0 代表每隔 0 时')"
            :addon-after="t('秒')"
          />
        </a-col>
        <a-col :xs="24" :md="6" :offset="0">
          <a-input v-model:value="newTask.count" :placeholder="t('执行次数，留空无限')" />
        </a-col>
      </a-row>
    </a-form-item>

    <div v-if="newTask.type === TYPE.CYCLE">
      <a-form-item>
        <a-typography-title :level="5">{{ t("触发时间") }}</a-typography-title>
        <a-time-picker
          v-model:value="newTask.objTime"
          size="large"
          :placeholder="$t('具体时间点')"
          class="w-100"
        />
      </a-form-item>
      <a-form-item>
        <a-checkbox-group v-model:value="newTask.weekend" :options="weeks" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("执行次数") }}</a-typography-title>
        <a-input v-model:value="newTask.count" :placeholder="t('留空无限')" />
      </a-form-item>
    </div>

    <a-form-item v-if="newTask.type === TYPE.SPECIFY">
      <a-typography-title :level="5">{{ t("请选择日期和时间") }}</a-typography-title>
      <a-date-picker v-model:value="newTask.objTime" show-time size="large" class="w-100" />
    </a-form-item>

    <a-form-item>
      <a-typography-title :level="5">{{ t("任务有效负载") }}</a-typography-title>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("比如命令，文件名或其他参数等") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-input v-model:value="newTask.payload" />
    </a-form-item>
  </a-modal>
</template>
