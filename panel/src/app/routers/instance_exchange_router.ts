import Router from "@koa/router";
import Koa from "koa";
import { toText } from "mcsmanager-common";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import {
  buyOrRenewInstance,
  getAllDaemon,
  getNodeStatus,
  parseUserName,
  queryInstanceByUserId,
  RequestAction
} from "../service/exchange_service";
import { logger } from "../service/log";
import { loginSuccess } from "../service/passport_service";
import UserSSOService from "../service/user_sso_service";

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
        ctx.body = UserSSOService.generateSSOToken(parseUserName(params?.username));
        return;
      }
      if (requestAction === RequestAction.GET_ALL_DAEMON) {
        ctx.body = await getAllDaemon();
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
  validator({
    query: { username: String, token: String, instanceId: String, daemonId: String, origin: String }
  }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = parseUserName(String(ctx.request.query.username));
    const token = String(ctx.request.query.token);
    const redirect = `${decodeURIComponent(
      String(ctx.request.query.origin)
    )}/#/instances/terminal?daemonId=${ctx.request.query.daemonId}&instanceId=${
      ctx.request.query.instanceId
    }&from=sso`;
    if (UserSSOService.verifySSOToken(userName, token)) {
      logger.warn("SSO login: username: %s, token: %s, redirect: %s", userName, token, redirect);
      loginSuccess(ctx, userName);
      return ctx.redirect(redirect);
    } else {
      throw new Error($t("TXT_CODE_13411df7"));
    }
  }
);
export default router;
