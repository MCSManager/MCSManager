import Router from "@koa/router";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import AlertService, { Alert } from "../service/alert_service";

const router = new Router({ prefix: "/alert" });

router.post(
  "/push",
  permission({ level: ROLE.ADMIN }),
  async (ctx) => {
    const body = ctx.request.body as {
      type?: string;
      instanceName?: string;
      instanceUuid?: string;
      daemonId?: string;
      message?: string;
    };

    if (!body.type || !body.instanceName || !body.instanceUuid || !body.daemonId || !body.message) {
      ctx.status = 400;
      ctx.body = { error: "Missing required fields" };
      return;
    }

    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: body.type as Alert["type"],
      instanceName: body.instanceName,
      instanceUuid: body.instanceUuid,
      daemonId: body.daemonId,
      message: body.message,
      timestamp: Date.now()
    };

    AlertService.pushAlert(alert);
    ctx.body = { ok: true };
  }
);

export default router;
