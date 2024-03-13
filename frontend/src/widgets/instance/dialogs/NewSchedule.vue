<script setup lang="ts">
import { ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import { notification } from "ant-design-vue";
import { ScheduleAction, ScheduleType, ScheduleCreateType } from "@/types/const";
import type { NewScheduleTask } from "@/types";
import { scheduleCreate } from "@/services/apis/instance";
import { useScreen } from "@/hooks/useScreen";
import { reportErrorMsg } from "@/tools/validator";
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
  { label: t("TXT_CODE_fcbdcb34"), value: 1 },
  { label: t("TXT_CODE_c73de59d"), value: 2 },
  { label: t("TXT_CODE_85617390"), value: 3 },
  { label: t("TXT_CODE_c9b31f8e"), value: 4 },
  { label: t("TXT_CODE_d4517dcb"), value: 5 },
  { label: t("TXT_CODE_d248b5c8"), value: 6 },
  { label: t("TXT_CODE_a621f370"), value: 7 }
];

interface NewTask extends NewScheduleTask {
  payload: string;
  weekend: string[];
  cycle: string[];
  objTime: string;
}

const newTaskOrigin: NewTask = {
  name: "",
  action: "command",
  count: "",
  type: ScheduleCreateType.INTERVAL,
  time: "",
  payload: "",
  weekend: [],
  cycle: ["0", "0", "0"],
  objTime: ""
};

let newTask = reactive<NewTask>(_.cloneDeep(newTaskOrigin));

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
  if (newTask.objTime === "") throw new Error(t("TXT_CODE_349edc57"));
  if (weekend.length === 0) throw new Error(t("TXT_CODE_2fe0cc84"));
  const time = new Date(newTask.objTime);
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  newTask.time = `${s} ${m} ${h} * * ${weekend.join(",")}`;
  await createRequest();
};

const createTaskTypeSpecify = async () => {
  if (newTask.objTime === "") throw new Error(t("TXT_CODE_349edc57"));
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
        daemonId: props.daemonId,
        uuid: props.instanceId
      },
      data: newTask
    });
    if (state.value) {
      emit("getScheduleList");
      notification.success({
        message: t("TXT_CODE_d28c05df")
      });
      newTask = reactive(_.cloneDeep(newTaskOrigin));
      open.value = false;
    }
  } catch (err: any) {
    console.error(err);
    reportErrorMsg(err.message);
  }
};

const submit = async () => {
  try {
    if (newTask.type === ScheduleCreateType.INTERVAL) await createTaskTypeInterval();
    if (newTask.type === ScheduleCreateType.CYCLE) await createTaskTypeCycle();
    if (newTask.type === ScheduleCreateType.SPECIFY) await createTaskTypeSpecify();
  } catch (err: any) {
    return reportErrorMsg(err.message);
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
    :title="t('TXT_CODE_3502273d')"
    :confirm-loading="isLoading"
    :destroy-on-close="true"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
    width="660px"
  >
    <a-form-item>
      <a-typography-title :level="5">{{ t("TXT_CODE_b290a4b0") }}</a-typography-title>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_b72d638d") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-input v-model:value="newTask.name" />
    </a-form-item>

    <a-form-item>
      <a-typography-title :level="5">{{ t("TXT_CODE_fcd641db") }}</a-typography-title>
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="12" :offset="0">
          <a-select
            v-model:value="newTask.action"
            :placeholder="t('TXT_CODE_3bb646e4')"
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
            :placeholder="t('TXT_CODE_3bb646e4')"
            :dropdown-match-select-width="false"
          >
            <a-select-option v-for="(type, i) in ScheduleType" :key="i" :value="i">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-col>
      </a-row>
    </a-form-item>

    <a-form-item v-if="newTask.type === ScheduleCreateType.INTERVAL">
      <a-typography-paragraph>
        <a-typography-text>
          {{ t("TXT_CODE_f17889f4") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="6" :offset="0">
          <a-input
            v-model:value="newTask.cycle[2]"
            :placeholder="t('TXT_CODE_ba8ebc7')"
            :addon-after="t('TXT_CODE_4e2c7f64')"
          />
        </a-col>
        <a-col :xs="24" :md="6" :offset="0">
          <a-input
            v-model:value="newTask.cycle[1]"
            :placeholder="t('TXT_CODE_ba8ebc7')"
            :addon-after="t('TXT_CODE_a7e9ff0f')"
          />
        </a-col>
        <a-col :xs="24" :md="6" :offset="0">
          <a-input
            v-model:value="newTask.cycle[0]"
            :placeholder="t('TXT_CODE_ba8ebc7')"
            :addon-after="t('TXT_CODE_acabc771')"
          />
        </a-col>
        <a-col :xs="24" :md="12" :offset="0">
          <a-input v-model:value="newTask.count" :placeholder="t('TXT_CODE_9156fbc')" />
        </a-col>
      </a-row>
      <a-row :gutter="[24, 24]"> </a-row>
    </a-form-item>

    <div v-if="newTask.type === ScheduleCreateType.CYCLE">
      <a-form-item>
        <a-typography-title :level="5">{{ t("TXT_CODE_3554dac0") }}</a-typography-title>
        <a-time-picker
          v-model:value="newTask.objTime"
          size="large"
          :placeholder="$t('TXT_CODE_38591f72')"
          class="w-100"
        />
      </a-form-item>
      <a-form-item>
        <a-checkbox-group v-model:value="newTask.weekend" :options="weeks" />
      </a-form-item>

      <a-form-item>
        <a-typography-title :level="5">{{ t("TXT_CODE_d9cfab1b") }}</a-typography-title>
        <a-input v-model:value="newTask.count" :placeholder="t('TXT_CODE_a59981f4')" />
      </a-form-item>
    </div>

    <a-form-item v-if="newTask.type === ScheduleCreateType.SPECIFY">
      <a-typography-title :level="5">{{ t("TXT_CODE_f3fe5c8e") }}</a-typography-title>
      <a-date-picker v-model:value="newTask.objTime" show-time size="large" class="w-100" />
    </a-form-item>

    <a-form-item>
      <a-typography-title :level="5">{{ t("TXT_CODE_61811ac") }}</a-typography-title>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_81297804") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-input v-model:value="newTask.payload" />
    </a-form-item>
  </a-modal>
</template>
