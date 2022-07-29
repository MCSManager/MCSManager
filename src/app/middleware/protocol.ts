// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

import Koa from "koa";
import { logger } from "../service/log";
import { Stream } from "stream";
import VisualDataSubsystem from "../service/system_visual_data";
import { systemConfig } from "../setting";

// Define standard response data format middleware
export async function middleware(
  ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
  next: Function
): Promise<void> {
  // 接口请求次数增加
  if (ctx.url.startsWith("/api/")) {
    VisualDataSubsystem.addRequestCount();
  }
  // 传递下一个中间件，遇到任何错误和返回数据将按照响应协议处理
  try {
    await next();
  } catch (error) {
    ctx.body = error;
  }

  // 设置公开头
  if (systemConfig.crossDomain) {
    ctx.response.set("Access-Control-Allow-Origin", "*");
    ctx.response.set("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    ctx.response.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
    );
  }

  // 产品信息标识
  ctx.cookies.set("MCSManager", "Copyright 2022 https://github.com/mcsmanager");
  ctx.response.set("X-Powered-By", "https://github.com/mcsmanager");

  // 发送Error类时序列化并显示
  if (ctx.body instanceof Error) {
    const error = ctx.body as Error;
    ctx.status = 500;
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: error.message,
      time: new Date().getTime()
    });
    return;
  }

  // 放行所有数据流
  if (ctx.body instanceof Stream) {
    return;
  }

  // 404 错误码
  if (ctx.status == 404) {
    ctx.status = 404;
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: "[404] Not Found",
      time: new Date().getTime()
    });
    return;
  }

  // 响应文本为字符串时则使用普通格式化
  if (typeof ctx.body == "string") {
    const status = ctx.status;
    const data = ctx.body;
    ctx.body = JSON.stringify({
      status,
      data,
      time: new Date().getTime()
    });
    return;
  }

  // 返回结果为空时，显示处理失败
  if (ctx.body === null || ctx.body === false || ctx.body === undefined) {
    ctx.status = 500;
    ctx.body = JSON.stringify({
      status: 500,
      data: ctx.body || null,
      time: new Date().getTime()
    });
    return;
  }

  // 正常数据
  if (ctx.status == 200) {
    ctx.body = JSON.stringify({
      status: ctx.status,
      data: ctx.body,
      time: new Date().getTime()
    });
    return;
  }
}
