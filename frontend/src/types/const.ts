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
  "-1": t("状态未知"),
  "0": t("已停止"),
  "1": t("正在停止"),
  "2": t("正在启动"),
  "3": t("正在运行")
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
  command: t("发送命令"),
  stop: t("停止实例"),
  start: t("开启实例"),
  restart: t("重启实例"),
  kill: t("终止实例")
};

export const ScheduleType = {
  1: t("间隔时间性任务"),
  2: t("周期时间性任务"),
  3: t("指定时间性任务")
};
