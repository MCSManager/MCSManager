// Define subsystem loading and routing loading for the application

import Koa from "koa";
import Router from "@koa/router";

// Load subsystem
import "./service/user_service";
import "./service/visual_data";
import "./service/remote_service";
import "./service/user_statistics";

// Load routes
import overviewRouter from "./routers/overview_router";

import userRouter from "./routers/user_overview_router";
import loginRouter from "./routers/login_router";
import lowUserRouter from "./routers/general_user_router";

import settingsRouter from "./routers/settings_router";

import instanceRouter from "./routers/instance_admin_router";
import userInstanceRouter from "./routers/instance_operate_router";

import serviceRouter from "./routers/daemon_router";
import filemanager_router from "./routers/filemananger_router";

import businessInstanceRouter from "./routers/business_instance_router";
import businessUserRouter from "./routers/manage_user_router";

import scheduleRouter from "./routers/schedule_router";

import environmentRouter from "./routers/environment_router";

// all routes load entry points
export function mountRouters(app: Koa<Koa.DefaultState, Koa.DefaultContext>) {
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
