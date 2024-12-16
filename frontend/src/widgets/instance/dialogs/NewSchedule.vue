<script setup lang="ts">
import { ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import { notification } from "ant-design-vue";
import { ScheduleAction, ScheduleType, ScheduleCreateType } from "@/types/const";
import type { Schedule, ScheduleTaskForm } from "@/types";
import { reportErrorMsg } from "@/tools/validator";
import dayjs from "dayjs";
import _ from "lodash";
import { useSchedule } from "@/hooks/useSchedule";

const props = defineProps<{
  daemonId: string;
  instanceId: string;
}>();
const isLoading = ref(false);
const editMode = ref(false);
const {
  createTaskTypeInterval,
  createTaskTypeCycle,
  createTaskTypeSpecify,
  calculateIntervalFromTime,
  calculateTimeFromCycle,
  parseTaskTime,
  createState,
  deleteSchedule
} = useSchedule(props.instanceId, props.daemonId);

const parseTime = {
  [ScheduleCreateType.INTERVAL]: (time: string) =>
    (newTask.cycle = calculateIntervalFromTime(time)),
  [ScheduleCreateType.CYCLE]: (time: string) => {
    const { objTime, weekend } = calculateTimeFromCycle(time);
    newTask.objTime = objTime;
    newTask.weekend = weekend;
  },
  [ScheduleCreateType.SPECIFY]: (time: string) => (newTask.objTime = parseTaskTime(time))
};
const emit = defineEmits(["getScheduleList"]);
const open = ref(false);
const openDialog = (task?: Schedule) => {
  newTask = reactive({
    ..._.cloneDeep(newTaskOrigin),
    ...task
  });

  editMode.value = !!task;

  if (editMode.value) parseTime[newTask.type](newTask.time);

  open.value = true;
};

const weeks = [
  { label: t("TXT_CODE_fcbdcb34"), value: 1 },
  { label: t("TXT_CODE_c73de59d"), value: 2 },
  { label: t("TXT_CODE_85617390"), value: 3 },
  { label: t("TXT_CODE_c9b31f8e"), value: 4 },
  { label: t("TXT_CODE_d4517dcb"), value: 5 },
  { label: t("TXT_CODE_d248b5c8"), value: 6 },
  { label: t("TXT_CODE_a621f370"), value: 7 }
];

const newTaskOrigin: ScheduleTaskForm = {
  name: "",
  action: "command",
  count: 0,
  type: ScheduleCreateType.INTERVAL,
  time: "",
  payload: "",
  weekend: [],
  cycle: ["0", "0", "0"],
  objTime: dayjs()
};

let newTask = reactive<ScheduleTaskForm>(_.cloneDeep(newTaskOrigin));

const create = {
  [ScheduleCreateType.INTERVAL]: (newTask: ScheduleTaskForm) => createTaskTypeInterval(newTask),
  [ScheduleCreateType.CYCLE]: (newTask: ScheduleTaskForm) => createTaskTypeCycle(newTask),
  [ScheduleCreateType.SPECIFY]: (newTask: ScheduleTaskForm) => createTaskTypeSpecify(newTask)
};

const submit = async () => {
  try {
    isLoading.value = true;
    if (editMode.value) await deleteSchedule(newTask.name, false);
    await create[newTask.type](newTask);
    if (createState.value) {
      emit("getScheduleList");
      notification.success({
        message: editMode.value ? t("TXT_CODE_d3de39b4") : t("TXT_CODE_d28c05df")
      });
      newTask = reactive(_.cloneDeep(newTaskOrigin));
      open.value = false;
    }
  } catch (err: any) {
    return reportErrorMsg(err.message);
  } finally {
    isLoading.value = false;
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
    width="660px"
    :mask-closable="false"
    :title="editMode ? t('TXT_CODE_1548649e') : t('TXT_CODE_3502273d')"
    :confirm-loading="isLoading"
    :destroy-on-close="true"
    :ok-text="t('TXT_CODE_abfe9512')"
    @ok="submit"
  >
    <a-form-item>
      <a-typography-title :level="5">{{ t("TXT_CODE_b290a4b0") }}</a-typography-title>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_b72d638d") }}
        </a-typography-text>
      </a-typography-paragraph>
      <a-input v-model:value="newTask.name" :disabled="editMode" />
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
            <a-select-option v-for="(type, i) in ScheduleType" :key="i" :value="Number(i)">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-col>
      </a-row>
    </a-form-item>

    <template v-if="newTask.type === ScheduleCreateType.INTERVAL">
      <a-form-item>
        <a-typography-paragraph>
          <a-typography-title :level="5">{{ t("TXT_CODE_3554dac0") }}</a-typography-title>
          <a-typography-text>
            {{ t("TXT_CODE_f17889f4") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-row :gutter="[24, 24]">
          <a-col :xs="24" :md="8" :offset="0">
            <a-input
              v-model:value="newTask.cycle[2]"
              :placeholder="t('TXT_CODE_ba8ebc7')"
              :addon-after="t('TXT_CODE_4e2c7f64')"
            />
          </a-col>
          <a-col :xs="24" :md="8" :offset="0">
            <a-input
              v-model:value="newTask.cycle[1]"
              :placeholder="t('TXT_CODE_ba8ebc7')"
              :addon-after="t('TXT_CODE_a7e9ff0f')"
            />
          </a-col>
          <a-col :xs="24" :md="8" :offset="0">
            <a-input
              v-model:value="newTask.cycle[0]"
              :placeholder="t('TXT_CODE_ba8ebc7')"
              :addon-after="t('TXT_CODE_acabc771')"
            />
          </a-col>
        </a-row>
      </a-form-item>
      <a-form-item>
        <a-typography-title :level="5">{{ t("TXT_CODE_d9cfab1b") }}</a-typography-title>
        <a-input-number
          v-model:value="newTask.count"
          size="large"
          class="w-100"
          :placeholder="t('TXT_CODE_a59981f4')"
        />
      </a-form-item>
    </template>

    <template v-if="newTask.type === ScheduleCreateType.CYCLE">
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
        <a-input-number
          v-model:value="newTask.count"
          size="large"
          class="w-100"
          :placeholder="t('TXT_CODE_a59981f4')"
        />
      </a-form-item>
    </template>

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
