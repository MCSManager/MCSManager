import Router from "@koa/router";
import permission from "../middleware/permission";
import RemoteServiceSubsystem from "../service/remote_service";
import VisualDataSubsystem from "../service/visual_data";
import RemoteRequest from "../service/remote_command";
import os from "os";
import { systemInfo } from "mcsmanager-common";
import { getVersion, specifiedDaemonVersion } from "../version";
import { GlobalVariable } from "mcsmanager-common";
import { ROLE } from "../entity/user";
import {
  LOGIN_FAILED_KEY,
  ILLEGAL_ACCESS_KEY,
  LOGIN_COUNT,
  LOGIN_FAILED_COUNT_KEY,
  BAN_IP_COUNT
} from "../service/passport_service";
import { operationLogger } from "../service/operation_logger";

const router = new Router({ prefix: "/overview" });

// [Top-level Permission]
// Control panel home page information overview routing
router.get("/", permission({ level: ROLE.ADMIN, token: false }), async (ctx) => {
  // Get the information of the remote service concurrently
  const requestTasks = Array.from(RemoteServiceSubsystem.services.entries()).map(
    async ([_, remoteService]) => {
      let remoteInfo: any = {};
      try {
        remoteInfo = await new RemoteRequest(remoteService).request("info/overview");
      } catch (err) {
        // ignore request errors and continue looping
      }
      // assign some identifier value
      remoteInfo.uuid = remoteService.uuid;
      remoteInfo.ip = remoteService.config.ip;
      remoteInfo.port = remoteService.config.port;
      remoteInfo.prefix = remoteService.config.prefix;
      remoteInfo.available = remoteService.available;
      remoteInfo.remarks = remoteService.config.remarks;
      return remoteInfo;
    }
  );

  const remoteInfoList = await Promise.all(requestTasks);
  const selfInfo = systemInfo();
  // Get the information of the system where the panel is located
  const overviewData: IPanelOverviewResponse = {
    version: getVersion(),
    specifiedDaemonVersion: specifiedDaemonVersion(),
    process: {
      cpu: selfInfo.processCpu,
      memory: process.memoryUsage().rss,
      cwd: selfInfo.cwd
    },
    record: {
      logined: GlobalVariable.get(LOGIN_COUNT, 0),
      illegalAccess: GlobalVariable.get(ILLEGAL_ACCESS_KEY, 0),
      banips: GlobalVariable.get(BAN_IP_COUNT, 0),
      loginFailed: GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0)
    },
    system: {
      user: os.userInfo(),
      time: new Date().getTime(),
      totalmem: selfInfo.totalmem,
      freemem: selfInfo.freemem,
      type: selfInfo.type,
      version: os.version(),
      node: process.version,
      hostname: selfInfo.hostname,
      loadavg: selfInfo.loadavg,
      platform: selfInfo.platform,
      release: selfInfo.release,
      uptime: os.uptime(),
      cpu: selfInfo.cpuUsage
    },
    chart: {
      system: VisualDataSubsystem.getSystemChartArray(),
      request: VisualDataSubsystem.getStatusChartArray()
    },
    remoteCount: RemoteServiceSubsystem.count(),
    remote: remoteInfoList
  };

  ctx.body = overviewData;
});

// [Top-level Permission]
// Get user operation logs
router.get("/operation_logs", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const limit = +(ctx?.query?.limit || 20);

  if (isNaN(limit)) return ctx.throw(400, "Invalid limit value. It must be a number.");

  if (limit <= 0 || limit > 200)
    return ctx.throw(400, "Invalid limit value. It must be between 1 and 200.");

  ctx.body = await operationLogger.get(limit);
});

export default router;
