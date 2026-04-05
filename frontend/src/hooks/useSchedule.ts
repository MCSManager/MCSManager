import { t } from "@/lang/i18n";
import { scheduleCreate, scheduleDelete, scheduleList } from "@/services/apis/instance";
import { reportErrorMsg } from "@/tools/validator";
import type { ScheduleTaskForm } from "@/types";
import { message, notification } from "ant-design-vue";
import dayjs from "dayjs";

export function useSchedule(instanceId: string, daemonId: string) {
  const createTaskTypeInterval = async (newTask: ScheduleTaskForm) => {
    const arr = newTask.cycle;
    let ps = Number(arr[0]);
    let pm = Number(arr[1]);
    let ph = Number(arr[2]);
    const rs = ps + pm * 60 + ph * 60 * 60;
    newTask.time = rs.toString();
    await createTask(newTask);
  };

  const createTaskTypeCycle = async (newTask: ScheduleTaskForm) => {
    const weekend = newTask.weekend;
    if (!newTask.objTime) throw new Error(t("TXT_CODE_349edc57"));
    if (weekend.length === 0) throw new Error(t("TXT_CODE_2fe0cc84"));
    const time = newTask.objTime;
    const h = time.hour();
    const m = time.minute();
    const s = time.second();
    newTask.time = `${s} ${m} ${h} * * ${weekend.join(",")}`;
    await createTask(newTask);
  };

  const createTaskTypeSpecify = async (newTask: ScheduleTaskForm) => {
    if (!newTask.objTime) throw new Error(t("TXT_CODE_349edc57"));
    const time = newTask.objTime;
    const mm = time.month() + 1;
    const dd = time.date();
    const h = time.hour();
    const m = time.minute();
    const s = time.second();
    newTask.time = `${s} ${m} ${h} ${dd} ${mm} *`;
    await createTask(newTask);
  };

  const calculateIntervalFromTime = (time: string): string[] => {
    const totalSeconds = Number(time);
    const ph = Math.floor(totalSeconds / 3600);
    const pm = Math.floor((totalSeconds % 3600) / 60);
    const ps = totalSeconds % 60;
    return [ps.toString(), pm.toString(), ph.toString()];
  };

  const calculateTimeFromCycle = (time: string) => {
    const regex = /(\d+) (\d+) (\d+) \* \* (.+)/;
    const match = time.match(regex);
    let objTime = dayjs(),
      weekend: number[] = [];
    if (match) {
      const s = match[1];
      const m = match[2];
      const h = match[3];
      const w = match[4].split(",").map(Number);

      const now = new Date();
      now.setSeconds(Number(s));
      now.setMinutes(Number(m));
      now.setHours(Number(h));
      objTime = dayjs(now);
      weekend = w;
    } else {
      notification.error({ message: t("TXT_CODE_afabf3ca") });
    }

    return {
      objTime,
      weekend
    };
  };

  const parseTaskTime = (time: string) => {
    const regex = /(\d+) (\d+) (\d+) (\d+) (\d+) \*/; // 匹配 time 格式
    const match = time.match(regex);
    let objTime = dayjs();
    if (match) {
      const s = Number(match[1]);
      const m = Number(match[2]);
      const h = Number(match[3]);
      const dd = Number(match[4]);
      const mm = Number(match[5]) - 1;

      const now = new Date();
      now.setSeconds(s);
      now.setMinutes(m);
      now.setHours(h);
      now.setDate(dd);
      now.setMonth(mm);
      objTime = dayjs(now);
    } else {
      notification.error({ message: t("TXT_CODE_afabf3ca") });
    }

    return objTime;
  };

  const { state: createState, execute: create } = scheduleCreate();
  const createTask = async (newTask: ScheduleTaskForm) => {
    try {
      if (!newTask.count) newTask.count = -1;
      await create({
        params: {
          daemonId: daemonId,
          uuid: instanceId
        },
        data: newTask
      });
    } catch (err: any) {
      console.error(err);
      reportErrorMsg(err.message);
    }
  };

  const { state: schedules, execute: list, isLoading: scheduleListLoading } = scheduleList();
  const getScheduleList = async () => {
    try {
      await list({
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

  const deleteSchedule = async (name: string, showMsg: boolean = true) => {
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
        showMsg && message.success(t("TXT_CODE_28190dbc"));
        getScheduleList();
      }
    } catch (err: any) {
      console.error(err);
      reportErrorMsg(err.message);
    }
  };

  return {
    createTaskTypeInterval,
    createTaskTypeCycle,
    createTaskTypeSpecify,

    calculateIntervalFromTime,
    calculateTimeFromCycle,
    parseTaskTime,

    createTask,
    createState,

    getScheduleList,
    scheduleListLoading,
    schedules,

    deleteSchedule
  };
}
