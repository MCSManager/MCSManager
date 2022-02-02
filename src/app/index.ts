/*
  Copyright (C) 2022 Suwings(https://github.com/Suwings)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  According to the GPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings(https://github.com/Suwings)

  本程序为自由软件，你可以依据 GPL 的条款（第三版或者更高），再分发和/或修改它。
  该程序以具有实际用途为目的发布，但是并不包含任何担保，
  也不包含基于特定商用或健康用途的默认担保。具体细节请查看 GPL 协议。

  根据协议，您必须保留所有版权声明，如果修改源码则必须开源修改后的源码。
  前往 https://mcsmanager.com/ 申请闭源开发授权或了解更多。
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
