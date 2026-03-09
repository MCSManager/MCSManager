import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export function parseTimestamp(st = 0) {
  if (!st) return "";
  return dayjs(st).format("YYYY-MM-DD HH:mm:ss");
}

export function dayjsToTimestamp(dayjs?: Dayjs) {
  if (!dayjs) return 0;
  return dayjs.valueOf();
}

export function timestampToDayjs(st = 0) {
  if (!st) return;
  return dayjs(st);
}
