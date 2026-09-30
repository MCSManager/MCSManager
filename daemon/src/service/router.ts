// Re-export the routerApp singleton and navigation() from the cycle-free
// router_app module, then trigger the router side-effect imports that register
// handlers/middlewares on it. See ./router_app.ts for why the singleton is split out.
import { $t } from "../i18n";
import logger from "./log";

// Ensure the singleton is instantiated before routers register against it.
import "./router_app";
export { routerApp, navigation, type RouterApp } from "./router_app";

// The authentication routing order must be the first load. These routing orders cannot be changed without authorization
import "../routers/auth_router";
import "../routers/environment_router";
import "../routers/file_router";
import "../routers/info_router";
import "../routers/instance_event_router";
import "../routers/Instance_router";
import "../routers/java_manager_router";
import "../routers/passport_router";
import "../routers/schedule_router";
import "../routers/stream_router";
import "../routers/upgrade_router";

logger.info($t("TXT_CODE_router.initComplete"));
