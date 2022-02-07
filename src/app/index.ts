/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
*/

// Define subsystem loading and routing loading for the application

import Koa from "koa";
import Router from "@koa/router";

// Load subsystem
import "./service/system_user";
import "./service/system_visual_data";
import "./service/system_remote_service";

// Load routes
import overviewRouter from "./routers/private/overview_router";

import userRouter from "./routers/private/top_user_router";
import loginRouter from "./routers/public/login_router";
import lowUserRouter from "./routers/protected/low_level_user_router";

import settingsRouter from "./routers/private/settings_router";

import instanceRouter from "./routers/private/instance_router";
import userInstanceRouter from "./routers/protected/user_instance_router";

import serviceRouter from "./routers/private/service_router";
import filemanager_router from "./routers/protected/filemananger_router";

import businessInstanceRouter from "./routers/protected/business_instance_router";
import businessUserRouter from "./routers/private/business_user_router";

import scheduleRouter from "./routers/protected/schedule_router";

import environmentRouter from "./routers/private/environment_router";

// 所有路由装载入口点
export function index(app: Koa<Koa.DefaultState, Koa.DefaultContext>) {
  // API router
  const apiRouter = new Router({ prefix: "/api" });
  apiRouter.use(overviewRouter.routes()).use(overviewRouter.allowedMethods());
  apiRouter.use(userInstanceRouter.routes()).use(userInstanceRouter.allowedMethods());
  apiRouter.use(instanceRouter.routes()).use(instanceRouter.allowedMethods());
  apiRouter.use(serviceRouter.routes()).use(serviceRouter.allowedMethods());
  apiRouter.use(filemanager_router.routes()).use(filemanager_router.allowedMethods());
  apiRouter.use(businessInstanceRouter.routes()).use(businessInstanceRouter.allowedMethods());
  apiRouter.use(businessUserRouter.routes()).use(businessUserRouter.allowedMethods());
  apiRouter.use(loginRouter.routes()).use(loginRouter.allowedMethods());
  apiRouter.use(lowUserRouter.routes()).use(lowUserRouter.allowedMethods());
  apiRouter.use(userRouter.routes()).use(userRouter.allowedMethods());
  apiRouter.use(scheduleRouter.routes()).use(scheduleRouter.allowedMethods());
  apiRouter.use(settingsRouter.routes()).use(settingsRouter.allowedMethods());
  apiRouter.use(environmentRouter.routes()).use(environmentRouter.allowedMethods());

  // Top router
  app.use(apiRouter.routes()).use(apiRouter.allowedMethods());
}
