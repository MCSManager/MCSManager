import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import monitorService from "../service/monitor_service";

routerApp.on("monitor/overview", async (ctx) => {
  protocol.response(ctx, monitorService.getAgentOverview());
});
