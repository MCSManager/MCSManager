/* eslint-disable no-unused-vars */
import { TYPE_UNIVERSAL } from "@/hooks/useInstance";
import { t } from "@/lang/i18n";
import type { QuickStartPackages } from ".";

export enum AppTheme {
  AUTO = 0,
  LIGHT,
  DARK
}

export const THEME_KEY = "THEME_KEY";

export const CARD_FIXED_HEIGHT = 200;

export const TERMINAL_CODE = [
  "UTF-8",
  "GBK",
  "GB2312",
  "GB18030",
  "BIG5",
  "Big5-HKSCS",
  "Shift_JIS",
  "KS_C_5601",
  "UTF-16"
];

export enum INSTANCE_STATUS_CODE {
  BUSY = -1,
  STOPPED = 0,
  STOPPING = 1,
  STARTING = 2,
  RUNNING = 3
}

export const INSTANCE_STATUS: Record<INSTANCE_STATUS_CODE, string> = {
  [INSTANCE_STATUS_CODE.BUSY]: t("TXT_CODE_342a04a9"),
  [INSTANCE_STATUS_CODE.STOPPED]: t("TXT_CODE_15f2e564"),
  [INSTANCE_STATUS_CODE.STOPPING]: t("TXT_CODE_a409b8a9"),
  [INSTANCE_STATUS_CODE.STARTING]: t("TXT_CODE_175b570d"),
  [INSTANCE_STATUS_CODE.RUNNING]: t("TXT_CODE_bdb620b9")
};

export const INSTANCE_CRASH_TIMEOUT = 2000;

export const defaultDockerfile = `FROM ubuntu:latest\nRUN mkdir -p /workspace\nWORKDIR /workspace\n`;

export const jdk8Dockerfile = `FROM eclipse-temurin:8
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const ubuntu22Dockerfile = `FROM ubuntu:22.04
RUN apt update && apt -y install libcurl4 && DEBIAN_FRONTEND="noninteractive" apt -y install tzdata
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const jdk17Dockerfile = `FROM eclipse-temurin:17
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const jdk8DockerfileCN = `FROM eclipse-temurin:8
RUN echo "zh_CN.UTF-8 UTF-8">/etc/locale.gen && locale-gen
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN.UTF-8
ENV LC_ALL=zh_CN.UTF-8
ENV TZ=Asia/Shanghai
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const ubuntu22DockerfileCN = `FROM ubuntu:22.04
ENV TZ=Asia/Shanghai
RUN sed -i -E 's/http:\\/\\/(archive|security).ubuntu.com/http:\\/\\/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list
RUN apt update && apt -y install libcurl4 && DEBIAN_FRONTEND="noninteractive" apt -y install tzdata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const jdk17DockerfileCN = `FROM eclipse-temurin:17
RUN echo "zh_CN.UTF-8 UTF-8">/etc/locale.gen && locale-gen
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN.UTF-8
ENV LC_ALL=zh_CN.UTF-8
ENV TZ=Asia/Shanghai
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export enum ScheduleActionTypeEnum {
  Delay = "delay",
  Command = "command",
  Stop = "stop",
  Start = "start",
  Restart = "restart",
  Kill = "kill"
}

export const ScheduleTypeEnum = {
  Interval: 1,
  Cycle: 2,
  Specify: 3
};

export const ScheduleActionType = {
  [ScheduleActionTypeEnum.Delay]: t("TXT_CODE_735baf9f"),
  [ScheduleActionTypeEnum.Command]: t("TXT_CODE_b7cab91d"),
  [ScheduleActionTypeEnum.Stop]: t("TXT_CODE_148d6467"),
  [ScheduleActionTypeEnum.Start]: t("TXT_CODE_8c7318b3"),
  [ScheduleActionTypeEnum.Restart]: t("TXT_CODE_77cc12da"),
  [ScheduleActionTypeEnum.Kill]: t("TXT_CODE_1c36c8f2")
};

export const ScheduleType = {
  [ScheduleTypeEnum.Interval]: t("TXT_CODE_ba497a8b"),
  [ScheduleTypeEnum.Cycle]: t("TXT_CODE_f17af923"),
  [ScheduleTypeEnum.Specify]: t("TXT_CODE_c4f90da6")
};

export enum ScheduleCreateType {
  INTERVAL = 1,
  CYCLE,
  SPECIFY
}

export const defaultDockerConfig: IGlobalInstanceDockerConfig = {
  containerName: "",
  image: "",
  memory: undefined,
  ports: [],
  extraVolumes: [],
  maxSpace: undefined,
  network: undefined,
  io: undefined,
  networkMode: "bridge",
  networkAliases: [],
  cpusetCpus: "",
  cpuUsage: undefined,
  workingDir: "/data",
  env: [],
  changeWorkdir: true,
  memorySwap: undefined,
  memorySwappiness: undefined,
  labels: []
};

export const defaultInstanceJavaConfig: IInstanceJavaConfig = {
  id: ""
};

export const defaultInstanceInfo: IGlobalInstanceConfig = {
  nickname: "",
  startCommand: "",
  stopCommand: "^c",
  cwd: "",
  ie: "UTF-8",
  oe: "UTF-8",
  createDatetime: new Date().getTime(),
  lastDatetime: 0,
  type: TYPE_UNIVERSAL,
  tag: [],
  endTime: 0,
  fileCode: "UTF-8",
  processType: "general",
  updateCommand: "",
  runAs: "",
  actionCommandList: [],
  crlf: 1,
  category: 0,
  basePort: undefined as any,

  // Steam RCON
  enableRcon: false,
  rconPassword: "",
  rconPort: undefined,
  rconIp: "",

  // Java
  java: defaultInstanceJavaConfig,

  // Old fields
  terminalOption: {
    haveColor: true,
    pty: false,
    ptyWindowCol: 164,
    ptyWindowRow: 40
  },
  eventTask: {
    autoStart: false,
    autoRestart: false,
    autoRestartMaxTimes: 3,
    ignore: false
  },
  docker: defaultDockerConfig,
  pingConfig: {
    ip: "",
    port: undefined,
    type: 1
  },
  extraServiceConfig: {
    openFrpTunnelId: "",
    openFrpToken: ""
  }
};

export const defaultQuickStartPackages: QuickStartPackages = {
  language: "",
  description: "",
  title: "",
  category: "",
  runtime: "",
  size: "",
  hardware: "",
  remark: "",
  targetLink: "",
  author: "",
  setupInfo: defaultInstanceInfo,
  gameType: "",
  image: "",
  platform: "",
  tags: [],
  isSummary: false
};
