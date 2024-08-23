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
import { toText } from "common";
import { logger } from "../service/log";

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
      const requestAction = toText(ctx.request.body.request_action) as RequestAction;
      const params = ctx.request.body.data ?? {};
      logger.info("Get exchange request, action: %s, params: %j", requestAction, params);
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
      logger.error("Exchange request error: " + err);
      ctx.body = err;
    }
  }
);

export default router;
