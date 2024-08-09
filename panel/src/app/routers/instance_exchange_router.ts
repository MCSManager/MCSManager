import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { ROLE } from "../entity/user";
import {
  buyOrRenewInstance,
  getNodeStatus,
  queryInstanceByUserId,
  RequestAction
} from "../service/exchange_service";

const router = new Router({ prefix: "/exchange" });

router.post(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({
    body: {
      request_action: String
    }
  }),
  async (ctx) => {
    try {
      const requestAction = ctx.request.body.request_action;
      const params = ctx.request.body.data ?? {};
      if (requestAction === RequestAction.PING) {
        ctx.body = await getNodeStatus(params);
        return;
      }
      if ([RequestAction.RENEW, RequestAction.BUY].includes(requestAction)) {
        ctx.body = await buyOrRenewInstance(requestAction, params);
        return;
      }
      if (requestAction === RequestAction.QUERY_INSTANCE) {
        ctx.body = await queryInstanceByUserId(params);
        return;
      }
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
