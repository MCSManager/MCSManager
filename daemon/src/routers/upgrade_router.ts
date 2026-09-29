// Daemon upgrade routes (socket.io events).
//
//   upgrade/info    -> return current/online version + update availability
//   upgrade/daemon  -> download the latest package, overlay it, restart
//
// Triggered by the panel via RemoteRequest (panel forwards the web UI click).

import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import { getUpgradeInfo, performUpgrade } from "../service/upgrade_service";

// Report whether a daemon self-update is available. The panel may forward its
// own updateSourceUrl in `data` so the daemon does not need local config.
routerApp.on("upgrade/info", async (ctx, data) => {
  try {
    const info = await getUpgradeInfo(data);
    protocol.response(ctx, info);
  } catch (e: any) {
    protocol.responseError(ctx, e);
  }
});

// Perform the daemon self-update. Resolves with { started, onlineVersion,
// message } BEFORE the process restarts; if no update is needed or the
// operation is guarded, started=false with an explanatory message.
// A thrown error (download/extract/overlay failure, rollback complete) is sent
// back via responseError so the panel does not wait for the RemoteRequest timeout.
routerApp.on("upgrade/daemon", async (ctx, data) => {
  try {
    const result = await performUpgrade(data);
    protocol.response(ctx, result);
  } catch (e: any) {
    protocol.responseError(ctx, e);
  }
});
