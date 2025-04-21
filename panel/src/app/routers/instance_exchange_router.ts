import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { ROLE } from "../entity/user";
import {
  buyOrRenewInstance,
  getNodeStatus,
  parseUserName,
  queryInstanceByUserId,
  REDEEM_PLATFORM_ADDR,
  RequestAction
} from "../service/exchange_service";
import { toText } from "mcsmanager-common";
import { logger } from "../service/log";
import Koa from "koa";
import UserSSOService from "../service/user_sso_service";
import { loginSuccess } from "../service/passport_service";
import { $t } from "../i18n";
import axios from "axios";

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

router.post(
  "/request_redeem_platform",
  permission({ token: false, level: null }),
  validator({
    body: { targetUrl: String, method: String }
  }),
  async (ctx) => {
    try {
      const url = REDEEM_PLATFORM_ADDR + String(ctx.request.body.targetUrl);
      const method = ctx.request.body.method;
      const data = ctx.request.body.data;
      const params = ctx.request.body.params;
      logger.info(
        "Request redeem platform, url: %s, method: %s, data: %j, params: %j",
        url,
        method,
        data,
        params
      );
      const res = await axios.request({
        url,
        method,
        data,
        params,
        timeout: 1000 * 30,
        headers: {
          "Content-Type": "application/json",
          "X-MCSManager-Panel": "true"
        }
      });
      logger.info("Request redeem platform response: %j", JSON.stringify(res.data));
      const realData = res.data;
      if (Number(realData.code) !== 200) {
        throw new Error(realData?.message ?? "Unknown error");
      }
      ctx.body = realData?.data ?? "";
    } catch (error) {
      logger.error("Request redeem platform error: " + error);
      ctx.body = error;
    }
  }
);

export default router;
