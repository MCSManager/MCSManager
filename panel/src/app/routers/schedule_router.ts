import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import { getUserUuid } from "../service/passport_service";
import { isHaveInstanceByUuid } from "../service/permission_service";
import { FILENAME_BLACKLIST } from "../const";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";
const router = new Router({ prefix: "/protected_schedule" });

// Routing permission verification middleware
router.use(async (ctx, next) => {
  const instanceUuid = String(ctx.query.uuid);
  const daemonId = String(ctx.query.daemonId);
  const userUuid = getUserUuid(ctx);
  if (isHaveInstanceByUuid(userUuid, daemonId, instanceUuid)) {
    await next();
  } else {
    ctx.status = 403;
    ctx.body = $t("TXT_CODE_permission.forbiddenInstance");
  }
});

// [Low-level Permission]
// Get the list of scheduled tasks
router.get(
  "/",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const list = await new RemoteRequest(RemoteServiceSubsystem.getInstance(daemonId)).request(
        "schedule/list",
        {
          instanceUuid
        }
      );
      ctx.body = list;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// create a scheduled task
router.post(
  "/",
  permission({ level: ROLE.USER }),
  validator({
    query: { daemonId: String, uuid: String },
    body: { name: String, count: Number, time: String, action: String, type: Number }
  }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const task = ctx.request.body;

      // Scheduled task name needs file name format check
      const name = String(task.name);
      FILENAME_BLACKLIST.forEach((ch) => {
        if (name.includes(ch)) throw new Error($t("TXT_CODE_router.schedule.invalidName"));
      });

      ctx.body = await new RemoteRequest(RemoteServiceSubsystem.getInstance(daemonId)).request(
        "schedule/register",
        {
          instanceUuid,
          name,
          count: Number(task.count),
          time: String(task.time),
          action: String(task.action),
          payload: String(task.payload),
          type: Number(task.type)
        }
      );
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Low-level Permission]
// delete scheduled task
router.delete(
  "/",
  permission({ level: ROLE.USER }),
  validator({ query: { daemonId: String, uuid: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const instanceUuid = String(ctx.query.uuid);
      const name = String(ctx.query.task_name);
      ctx.body = await new RemoteRequest(RemoteServiceSubsystem.getInstance(daemonId)).request(
        "schedule/delete",
        {
          instanceUuid,
          name
        }
      );
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
