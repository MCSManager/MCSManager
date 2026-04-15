import type { ControlLogLine, ControlTarget } from "@/types/control";

export const CONTROL_POLL_INTERVAL_MS = 1000;
export const CONTROL_OUTPUT_LOG_SIZE = 64 * 1024;
export const CONTROL_MAX_LOG_LINES = 200;

let controlLogSequence = 0;

export const createControlTargetKey = (
  target: Pick<ControlTarget, "daemonId" | "mode" | "instanceId">
) => `${target.daemonId}:${target.mode}:${target.instanceId}`;

export const formatControlLogTime = (date = new Date()) =>
  date.toLocaleTimeString("zh-CN", {
    hour12: false
  });

export const createControlLogLine = (
  level: ControlLogLine["level"],
  text: string,
  date = new Date()
): ControlLogLine => ({
  id: `control-log-${date.getTime()}-${controlLogSequence++}`,
  time: formatControlLogTime(date),
  level,
  text
});

export const trimControlLogLines = (lines: ControlLogLine[], max = CONTROL_MAX_LOG_LINES) =>
  lines.length > max ? lines.slice(-max) : lines;

export const normalizeControlOutputLog = (raw?: string | null) =>
  String(raw ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

export const splitControlOutputLog = (raw?: string | null) => {
  const lines = normalizeControlOutputLog(raw).split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
};
