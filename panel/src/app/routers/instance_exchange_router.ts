import Router from "@koa/router";
import Koa from "koa";
import { toNumber, toText } from "mcsmanager-common";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import {
  buyOrRenewInstance,
  getNodeStatus,
  parseUserName,
  queryInstanceByUserId,
  RequestAction,
  requestUseRedeem
} from "../service/exchange_service";
import { logger } from "../service/log";
import { loginSuccess } from "../service/passport_service";
import UserSSOService from "../service/user_sso_service";
import { systemConfig } from "../setting";
import { execWithMutexId } from "../utils/sync";

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
      code: String
    }
  }),
  async (ctx) => {
    const panelId = systemConfig?.panelId || "";
    const registerCode = systemConfig?.registerCode || "";
    const productId = toNumber(ctx.request.body.productId) ?? 0;
    const daemonId = toText(ctx.request.body.daemonId) ?? "";
    const code = toText(ctx.request.body.code) ?? "";

    // Optional
    const instanceId = toText(ctx.request.body.instanceId) ?? "";
    const username = toText(ctx.request.body.username) ?? "";

    const response = await execWithMutexId(`buy-${code}`, async () => {
      // First, check if the redeem code is valid
      const productInfo = await requestUseRedeem(
        panelId,
        registerCode,
        productId,
        daemonId,
        code,
        false
      );

      const hours = productInfo?.hours;
      if (!hours || !productInfo?.payload) {
        throw new Error($t("TXT_CODE_45d7b982"));
      }

      const { config } = JSON.parse(productInfo.payload) as {
        config: Partial<IGlobalInstanceConfig>;
      };

      logger.info(`Router /request_buy_instance Report: Product: ${JSON.stringify(productInfo)}`);

      if (!config || !productId) {
        throw new Error($t("TXT_CODE_c92156bb"));
      }

      const params = {
        category_id: productId,
        payload: config,
        username: username,
        node_id: daemonId,
        hours: hours,
        instance_id: instanceId,
        code: code
      };

      try {
        return await buyOrRenewInstance(
          instanceId ? RequestAction.RENEW : RequestAction.BUY,
          params,
          {
            onCreateConfirm: async () => {
              // Then, delete the redeem code
              await requestUseRedeem(panelId, registerCode, productId, daemonId, code, true);
            }
          }
        );
      } catch (error) {
        logger.error($t("TXT_CODE_55b1f20e"), error);

        throw error;
      }
    });

    ctx.body = response;
  }
);
export default router;
