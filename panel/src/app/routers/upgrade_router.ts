// Panel upgrade routes (HTTP under /api/upgrade).
//
//   GET  /upgrade/panel_info   -> panel's own version + online update info
//   POST /upgrade/panel        -> trigger panel self-update (download/overlay/restart)
//   GET  /upgrade/daemon_info  -> forward to a daemon: its update info
//   POST /upgrade/daemon       -> forward to a daemon: trigger its self-update

import Router from "@koa/router";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";
import { getUpgradeInfo, performUpgrade } from "../service/upgrade_service";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { systemConfig } from "../setting";

const router = new Router({ prefix: "/upgrade" });

// Forward the panel's own updateSourceUrl to the daemon so the daemon can be
// updated from the panel UI without the operator editing the daemon config.
function forwardedSource(): { updateSourceUrl?: string } {
  const url = (systemConfig?.updateSourceUrl || "").trim();
  return url ? { updateSourceUrl: url } : {};
}

// Timeouts must be larger than the longest step the remote performs:
//   - upgrade/info: daemon fetches the manifest (15s internal) -> forward 25s.
//   - upgrade/daemon: daemon downloads+extracts+overlays BEFORE responding ->
//     allow generous time for a large package on a slow link (180s).
const DAEMON_INFO_TIMEOUT = 25000;
const DAEMON_UPGRADE_TIMEOUT = 180000;

function requireDaemon(uuid: string) {
  if (!RemoteServiceSubsystem.services.has(uuid)) {
    throw new Error($t("TXT_CODE_AUTOUPDATE_B_DAEMON_MISSING"));
  }
  const daemon = RemoteServiceSubsystem.getInstance(uuid);
  if (!daemon) throw new Error($t("TXT_CODE_AUTOUPDATE_B_DAEMON_MISSING"));
  return daemon;
}

// [Top-level Permission]
// Panel self-update info (current vs online version).
router.get("/panel_info", permission({ level: ROLE.ADMIN }), async (ctx) => {
  ctx.body = await getUpgradeInfo();
});

// [Top-level Permission]
// Trigger the panel self-update. Responds immediately; the panel restarts
// ~1s later, which drops the HTTP/socket connection briefly.
router.post("/panel", permission({ level: ROLE.ADMIN }), async (ctx) => {
  try {
    ctx.body = await performUpgrade();
  } catch (e: any) {
    ctx.status = 500;
    ctx.body = { started: false, message: String(e?.message || e) };
  }
});

// [Top-level Permission]
// Forward: query a daemon for its update info.
router.get(
  "/daemon_info",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.query.uuid);
    try {
      ctx.body = await new RemoteRequest(requireDaemon(uuid)).request(
        "upgrade/info",
        forwardedSource(),
        DAEMON_INFO_TIMEOUT
      );
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = { message: String(e?.message || e) };
    }
  }
);

// [Top-level Permission]
// Forward: trigger a daemon self-update.
router.post(
  "/daemon",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { uuid: String } }),
  async (ctx) => {
    const uuid = String(ctx.query.uuid);
    try {
      ctx.body = await new RemoteRequest(requireDaemon(uuid)).request(
        "upgrade/daemon",
        forwardedSource(),
        DAEMON_UPGRADE_TIMEOUT
      );
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = { started: false, message: String(e?.message || e) };
    }
  }
);

export default router;
