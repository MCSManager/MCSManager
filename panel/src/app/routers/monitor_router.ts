import Router from "@koa/router";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";

const router = new Router({ prefix: "/monitor" });

router.get("/servers", permission({ level: ROLE.ADMIN }), async (ctx) => {
  const nodes: IMcsmMonitorNodeOverview[] = [];
  const servers: IMcsmMonitorOverviewResponse["servers"] = [];

  for (const remoteService of RemoteServiceSubsystem.services.values()) {
    let overview:
      | {
          generatedAt: number;
          host: IMcsmMonitorHostSnapshot;
          servers: IMcsmMonitorServerSnapshot[];
        }
      | undefined;

    try {
      overview = await new RemoteRequest(remoteService).request("monitor/overview");
    } catch (error) {
      overview = undefined;
    }

    const nodeItem: IMcsmMonitorNodeOverview = {
      daemonId: remoteService.uuid,
      daemonIp: remoteService.config.ip,
      daemonPort: remoteService.config.port,
      daemonPrefix: remoteService.config.prefix,
      daemonRemarks: remoteService.config.remarks,
      available: remoteService.available,
      host: overview?.host,
      servers: overview?.servers ?? []
    };
    nodes.push(nodeItem);

    for (const server of nodeItem.servers) {
      servers.push({
        ...server,
        daemonId: nodeItem.daemonId,
        daemonRemarks: nodeItem.daemonRemarks,
        daemonIp: nodeItem.daemonIp,
        daemonPort: nodeItem.daemonPort,
        daemonPrefix: nodeItem.daemonPrefix,
        daemonAvailable: nodeItem.available
      });
    }
  }

  ctx.body = {
    generatedAt: Date.now(),
    summary: {
      nodesTotal: nodes.length,
      nodesOnline: nodes.filter((node) => node.available).length,
      serversTotal: servers.length,
      serversRunning: servers.filter((server) => server.processRunning).length,
      pluginOnline: servers.filter((server) => server.plugin.online).length
    },
    nodes,
    servers
  } satisfies IMcsmMonitorOverviewResponse;
});

export default router;
