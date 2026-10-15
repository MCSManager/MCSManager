import { requestPanel } from "./http";
import { sleep } from "./util";

// Set a user's instance-ownership list via PUT /api/auth, then verify via
// /auth/overview. Pass instances=[] to REVOKE all instance ownership.
// Mirrors ensureOwner's request shape + verify pattern, but is driven by an
// explicit userUuid + instances list. Retries because the panel user store
// can be transiently empty across file boundaries (see ensureOwner in http.ts).
export async function setUserInstances(
  key: string,
  userUuid: string,
  instances: { daemonId: string; instanceUuid: string }[]
): Promise<void> {
  for (let i = 0; i < 8; i++) {
    const putRes = await requestPanel({
      method: "PUT",
      path: "/auth",
      key,
      body: { uuid: userUuid, config: { instances } }
    });
    const ov = await requestPanel({
      method: "GET",
      path: "/auth/overview",
      key
    });
    const me = (ov.data || []).find((x: any) => x.uuid === userUuid);
    if (!me) {
      // Panel user store transiently empty — retry
      await sleep(600);
      continue;
    }
    const current: any[] = me.instances || [];
    const expectedKeys = new Set(
      instances.map((inst) => `${inst.daemonId}:${inst.instanceUuid}`)
    );
    const currentKeys = new Set(
      current.map((x: any) => `${x.daemonId}:${x.instanceUuid}`)
    );
    const matches =
      expectedKeys.size === currentKeys.size &&
      [...expectedKeys].every((k) => currentKeys.has(k));
    if (putRes.httpStatus === 200 && matches) return;
    // Assign did not stick — panel user store may be transient; retry
    await sleep(600);
  }
  throw new Error(
    `setUserInstances: could not set instances for ${userUuid} (expected ${JSON.stringify(instances)})`
  );
}
