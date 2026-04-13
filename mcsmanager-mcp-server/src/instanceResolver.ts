import type {
  InstanceQuery,
  McsmMonitorOverviewResponse,
  McsmMonitorServerWithDaemon
} from "./types.js";

export type InstanceResolveResult =
  | { type: "found"; instance: McsmMonitorServerWithDaemon }
  | { type: "not_found"; candidates: [] }
  | { type: "ambiguous"; candidates: McsmMonitorServerWithDaemon[] };

export function resolveInstance(
  overview: McsmMonitorOverviewResponse,
  query: InstanceQuery
): InstanceResolveResult {
  const instanceUuid = query.instanceUuid?.trim();
  const instanceName = query.instanceName?.trim();

  if (instanceUuid) {
    return resultFromMatches(overview.servers.filter((server) => isSameUuid(server, instanceUuid)));
  }

  if (!instanceName) return { type: "not_found", candidates: [] };

  const normalizedName = normalize(instanceName);
  const exactNameMatches = overview.servers.filter(
    (server) => normalize(server.instanceName) === normalizedName
  );
  if (exactNameMatches.length > 0) return resultFromMatches(exactNameMatches);

  return resultFromMatches(
    overview.servers.filter((server) => normalize(server.instanceName).includes(normalizedName))
  );
}

export function findInstanceByUuid(
  overview: McsmMonitorOverviewResponse,
  daemonId: string,
  instanceUuid: string
): McsmMonitorServerWithDaemon | undefined {
  return overview.servers.find(
    (server) => server.daemonId === daemonId && isSameUuid(server, instanceUuid)
  );
}

function resultFromMatches(matches: McsmMonitorServerWithDaemon[]): InstanceResolveResult {
  if (matches.length === 1) return { type: "found", instance: matches[0] };
  if (matches.length > 1) return { type: "ambiguous", candidates: matches };
  return { type: "not_found", candidates: [] };
}

function isSameUuid(server: McsmMonitorServerWithDaemon, instanceUuid: string): boolean {
  return server.instanceId === instanceUuid || server.serverId === instanceUuid;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
