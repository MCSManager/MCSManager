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
import Koa from "koa";
import UserSSOService from "../service/user_sso_service";
import { loginSuccess } from "../service/passport_service";
import { $t } from "../i18n";

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
      if (requestAction === RequestAction.SSO_TOKEN) {
        ctx.body = UserSSOService.generateSSOToken(params?.username);
        return;
      }
    } catch (err) {
      logger.error("Exchange request error: " + err);
      ctx.body = err;
    }
  }
);

router.get(
  "/sso",
  permission({ token: false, level: null }),
  validator({ query: { username: String, token: String, redirect: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const token = String(ctx.request.body.token);
    const redirect = decodeURIComponent(String(ctx.request.body.redirect));
    if (UserSSOService.verifySSOToken(userName, token)) {
      loginSuccess(ctx, userName);
      return ctx.redirect(redirect);
    } else {
      throw new Error($t("TXT_CODE_13411df7"));
    }
  }
);

export default router;
