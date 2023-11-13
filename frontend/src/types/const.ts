import { t } from "@/lang/i18n";
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

export const INSTANCE_STATUS = {
  "-1": t("TXT_CODE_6ffdeae8"),
  "0": t("TXT_CODE_4ef6b040"),
  "1": t("TXT_CODE_6bb63f94"),
  "2": t("TXT_CODE_ecfe33cb"),
  "3": t("TXT_CODE_f912fadc")
};

export const defaultDockerFile = `FROM ubuntu:latest\nRUN mkdir -p /workspace\nWORKDIR /workspace\n`;

export const openjdk8 = `FROM openjdk:8-jre
RUN apt update && apt install -y locales
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const openjdk16 = `FROM openjdk:16.0.2
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const ubuntu22 = `FROM ubuntu:22.04
RUN apt update && apt -y install libcurl4 && DEBIAN_FRONTEND="noninteractive" apt -y install tzdata
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const openjdk17 = `FROM openjdk:17
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const openjdk8CN = `FROM openjdk:8-jre
RUN sed -i -E 's/http:\\/\\/(deb|security).debian.org/http:\\/\\/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list
RUN apt update && apt install -y locales
RUN echo "zh_CN.UTF-8 UTF-8">/etc/locale.gen && locale-gen
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN.UTF-8
ENV LC_ALL=zh_CN.UTF-8
ENV TZ=Asia/Shanghai
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const openjdk16CN = `FROM openjdk:16.0.2
RUN mkdir -p /workspace
ENV TZ=Asia/Shanghai
WORKDIR /workspace
`;

export const ubuntu22CN = `FROM ubuntu:22.04
ENV TZ=Asia/Shanghai
RUN sed -i -E 's/http:\\/\\/(archive|security).ubuntu.com/http:\\/\\/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list
RUN apt update && apt -y install libcurl4 && DEBIAN_FRONTEND="noninteractive" apt -y install tzdata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN mkdir -p /workspace
WORKDIR /workspace
`;

export const openjdk17CN = `FROM openjdk:17
RUN mkdir -p /workspace
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN.UTF-8
ENV LC_ALL=zh_CN.UTF-8
ENV TZ=Asia/Shanghai
WORKDIR /workspace
`;

export const ScheduleAction = {
  command: t("TXT_CODE_b7cab91d"),
  stop: t("TXT_CODE_148d6467"),
  start: t("TXT_CODE_8c7318b3"),
  restart: t("TXT_CODE_77cc12da"),
  kill: t("TXT_CODE_1c36c8f2")
};

export const ScheduleType = {
  1: t("TXT_CODE_ba497a8b"),
  2: t("TXT_CODE_f17af923"),
  3: t("TXT_CODE_c4f90da6")
};

export enum ScheduleCreateType {
  INTERVAL = "1",
  CYCLE = "2",
  SPECIFY = "3"
}
