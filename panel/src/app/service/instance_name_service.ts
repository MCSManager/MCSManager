import RemoteRequest from "./remote_command";
import RemoteServiceSubsystem from "./remote_service";

interface CacheEntry {
  name?: string;
  time: number;
}

const CACHE_TTL_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 3000;
const nameCache = new Map<string, CacheEntry>();

export async function getInstanceNameSafely(
  daemonId?: string,
  instanceUuid?: string
): Promise<string | undefined> {
  if (!daemonId || !instanceUuid) return undefined;
  const key = `${daemonId}/${instanceUuid}`;
  const hit = nameCache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.name;
  let name: string | undefined;
  try {
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
    const detail = await new RemoteRequest(remoteService).request(
      "instance/detail",
      { instanceUuid },
      REQUEST_TIMEOUT_MS
    );
    name = detail?.config?.nickname || undefined;
  } catch {
    name = undefined;
  }
  nameCache.set(key, { name, time: Date.now() });
  return name;
}
