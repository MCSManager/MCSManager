import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { ROLE } from "../entity/user";
import {
  buyOrRenewInstance,
  getNodeStatus,
  IRedeemResponseProtocol,
  parseUserName,
  queryInstanceByUserId,
  REDEEM_PLATFORM_ADDR,
  RequestAction
} from "../service/exchange_service";
import { toNumber, toText } from "mcsmanager-common";
import { logger } from "../service/log";
import Koa from "koa";
import UserSSOService from "../service/user_sso_service";
import { loginSuccess } from "../service/passport_service";
import { $t } from "../i18n";
import axios from "axios";
import { systemConfig } from "../setting";

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
  "/request_buy_instance",
  permission({ token: false, level: null }),
  validator({
    body: {
      productId: Number,
      daemonId: String,
      payload: String,
      code: String
    }
  }),
  async (ctx) => {
    const panelId = systemConfig?.panelId;
    const registerCode = systemConfig?.registerCode;
    const productId = toNumber(ctx.request.body.productId) ?? 0;
    const daemonId = toText(ctx.request.body.daemonId) ?? "";
    const payload = toText(ctx.request.body.payload) ?? "";
    const code = toText(ctx.request.body.code);

    // Optional
    const instanceId = toText(ctx.request.body.targetInstanceId) ?? "";
    const username = toText(ctx.request.body.username) ?? "";

    if (username.length < 4) {
      throw new Error($t("TXT_CODE_router.user.invalidUserName"));
    }

    const { data: responseData } = await axios.post<IRedeemResponseProtocol<IBusinessProductInfo>>(
      `${REDEEM_PLATFORM_ADDR}/api/iframe_instances/use_redeem`,
      {
        panelId,
        registerCode,
        productId,
        daemonId,
        payload,
        code
      },
      {
        headers: {
          "X-Panel-Id": panelId
        }
      }
    );

    const productInfo = responseData?.data;
    const hours = productInfo?.hours;
    if (!hours) {
      throw new Error($t("请求套餐详情失败，请稍后重试！"));
    }

    const { config } = JSON.parse(payload || "{}") as { config: Partial<IGlobalInstanceConfig> };
    if (!config) {
      throw new Error("Invalid payload");
    }

    const params = {
      category_id: productId,
      payload: config,
      username: username,
      node_id: daemonId,
      hours: hours,
      instance_id: instanceId,
      code: code ?? ""
    };

    const res = await buyOrRenewInstance(
      instanceId ? RequestAction.RENEW : RequestAction.BUY,
      params
    );
    ctx.body = res;
  }
);
export default router;
