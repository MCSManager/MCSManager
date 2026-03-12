import Router from "@koa/router";
import Koa from "koa";
import { ROLE } from "../entity/user";
import { $t } from "../i18n";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { logger } from "../service/log";
import { operationLogger } from "../service/operation_logger";
import { checkBanIp, loginSuccess } from "../service/passport_service";
import {
  buildAuthorizationUrl,
  generateCodeVerifier,
  generateNonce,
  generateState,
  getCallbackUrl,
  getPublicSsoConfig,
  handleOIDCCallback,
  handleOAuth2Callback
} from "../service/sso_service";
import userSystem, { TwoFactorError } from "../service/user_service";
import { systemConfig } from "../setting";

const router = new Router({ prefix: "/auth/sso" });

// [Public] Return SSO configuration (no secrets)
router.get(
  "/config",
  permission({ token: false, level: null, speedLimit: false }),
  async (ctx: Koa.ParameterizedContext) => {
    ctx.body = getPublicSsoConfig();
  }
);

// [Public] Initiate SSO authorization - redirects to IdP
router.get(
  "/authorize",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig?.ssoEnabled) {
      ctx.status = 403;
      ctx.body = "SSO is not enabled";
      return;
    }

    if (!checkBanIp(ctx)) {
      ctx.status = 403;
      ctx.body = $t("TXT_CODE_router.login.ban");
      return;
    }

    try {
      const state = generateState();
      const nonce = generateNonce();
      const codeVerifier = generateCodeVerifier();

      if (!ctx.session) throw new Error("Session is null");
      ctx.session["ssoState"] = state;
      ctx.session["ssoNonce"] = nonce;
      ctx.session["ssoCodeVerifier"] = codeVerifier;
      ctx.session["ssoTimestamp"] = Date.now();
      ctx.session.save();

      const url = await buildAuthorizationUrl(state, nonce, codeVerifier, ctx);
      ctx.redirect(url);
    } catch (err: any) {
      const oauthDesc = err.error_description || err.message || "Authorization redirect failed";
      logger.error("[SSO] Authorization redirect failed: " + oauthDesc);
      const params = new URLSearchParams({
        sso_error: err.error || "sso_init_failed",
        sso_error_desc: oauthDesc
      });
      ctx.redirect(`/#/login?${params.toString()}`);
    }
  }
);

// [Public] SSO callback from IdP
router.get(
  "/callback",
  permission({ token: false, level: null }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig?.ssoEnabled) {
      ctx.status = 403;
      ctx.body = "SSO is not enabled";
      return;
    }

    if (!ctx.session) {
      ctx.redirect("/#/login?sso_error=session_expired");
      return;
    }

    const expectedState = ctx.session["ssoState"];
    const expectedNonce = ctx.session["ssoNonce"];
    const codeVerifier = ctx.session["ssoCodeVerifier"];
    const ssoTimestamp = ctx.session["ssoTimestamp"];

    // Clean up session SSO data immediately
    delete ctx.session["ssoState"];
    delete ctx.session["ssoNonce"];
    delete ctx.session["ssoCodeVerifier"];
    delete ctx.session["ssoTimestamp"];
    ctx.session.save();

    const isOAuth2 = systemConfig?.ssoType === "oauth2";
    if (!expectedState || !codeVerifier || (!isOAuth2 && !expectedNonce)) {
      ctx.redirect("/#/login?sso_error=invalid_sso_session");
      return;
    }

    // Reject if the SSO flow took longer than 10 minutes
    if (!ssoTimestamp || Date.now() - ssoTimestamp > 10 * 60 * 1000) {
      ctx.redirect("/#/login?sso_error=sso_session_expired");
      return;
    }

    const callbackUrl = new URL(ctx.href);

    // Check if the IdP returned an error directly (e.g. user denied consent)
    const idpError = callbackUrl.searchParams.get("error");
    if (idpError) {
      const idpDesc = callbackUrl.searchParams.get("error_description") || "";
      logger.error(`[SSO] IdP returned error: ${idpError} - ${idpDesc}`);
      const params = new URLSearchParams({ sso_error: idpError });
      if (idpDesc) params.set("sso_error_desc", idpDesc);
      ctx.redirect(`/#/login?${params.toString()}`);
      return;
    }

    try {
      let sub: string;
      let claims: Record<string, unknown>;

      if (isOAuth2) {
        const code = callbackUrl.searchParams.get("code");
        if (!code) throw new Error("OAuth 2.0 callback missing code parameter");
        const stateParam = callbackUrl.searchParams.get("state");
        if (stateParam !== expectedState) throw new Error("OAuth 2.0 state mismatch");
        ({ sub, claims } = await handleOAuth2Callback(code, codeVerifier, ctx));
      } else {
        const configuredCallback = getCallbackUrl(ctx);
        const reconstructedUrl = new URL(configuredCallback);
        reconstructedUrl.search = callbackUrl.search;
        ({ sub, claims } = await handleOIDCCallback(
          reconstructedUrl,
          expectedState,
          expectedNonce,
          codeVerifier
        ));
      }

      logger.info(`[SSO] Callback received for sub: ${sub}`);

      // Check if user is already bound
      const existingUser = userSystem.getUserBySsoSub(sub);
      if (existingUser) {
        loginSuccess(ctx, existingUser.userName);
        operationLogger.info("user_login", {
          operator_ip: ctx.ip,
          operator_name: existingUser.userName,
          login_result: true,
          login_method: "sso"
        });
        ctx.redirect("/#/sso/callback");
        return;
      }

      // Not bound yet - redirect to bind page
      ctx.session!["ssoBindSub"] = sub;
      ctx.session!["ssoBindClaims"] = JSON.stringify(claims);
      ctx.session!["ssoBindTimestamp"] = Date.now();
      ctx.session!.save();

      ctx.redirect("/#/sso/bind");
    } catch (err: any) {
      const oauthError = err.error || "";
      const oauthDesc = err.error_description || "";
      const errDetail = oauthDesc || oauthError || err.message || "Unknown error";
      logger.error(`[SSO] Callback processing failed: ${oauthError || err.message} - ${oauthDesc}`);
      const params = new URLSearchParams({
        sso_error: oauthError || "sso_auth_failed",
        sso_error_desc: errDetail
      });
      ctx.redirect(`/#/login?${params.toString()}`);
    }
  }
);

// [Public] Bind SSO to existing MCSManager account
router.post(
  "/bind",
  permission({ token: false, level: null }),
  validator({ body: { username: String, password: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig?.ssoEnabled) {
      ctx.status = 403;
      ctx.body = "SSO is not enabled";
      return;
    }

    if (!checkBanIp(ctx)) throw new Error($t("TXT_CODE_router.login.ban"));

    if (!ctx.session) throw new Error("Session is null");

    const ssoSub = ctx.session["ssoBindSub"];
    const ssoBindTimestamp = ctx.session["ssoBindTimestamp"];

    if (!ssoSub) {
      throw new Error("No pending SSO binding session");
    }

    // Reject if the bind session is older than 10 minutes
    if (!ssoBindTimestamp || Date.now() - ssoBindTimestamp > 10 * 60 * 1000) {
      delete ctx.session["ssoBindSub"];
      delete ctx.session["ssoBindClaims"];
      delete ctx.session["ssoBindTimestamp"];
      ctx.session.save();
      throw new Error("SSO binding session expired");
    }

    // Check if this SSO sub is already bound to another account
    const alreadyBound = userSystem.getUserBySsoSub(ssoSub);
    if (alreadyBound) {
      delete ctx.session["ssoBindSub"];
      delete ctx.session["ssoBindClaims"];
      delete ctx.session["ssoBindTimestamp"];
      ctx.session.save();
      throw new Error("This SSO account is already bound to another user");
    }

    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const code = String(ctx.request.body.code || "");

    try {
      const totpDrift = systemConfig?.totpDriftToleranceSteps || 0;
      userSystem.checkUser({ userName, passWord }, code || undefined, totpDrift);
    } catch (err) {
      if (err instanceof TwoFactorError && !code) {
        ctx.body = "NEED_2FA";
        return;
      }
      throw err;
    }

    const user = userSystem.getUserByUserName(userName);
    if (!user) throw new Error("User not found");

    if (user.ssoBound && user.ssoSub) {
      throw new Error("This account is already bound to another SSO provider");
    }

    await userSystem.bindSso(user.uuid, ssoSub);

    // Clean up session
    delete ctx.session["ssoBindSub"];
    delete ctx.session["ssoBindClaims"];
    delete ctx.session["ssoBindTimestamp"];

    const token = loginSuccess(ctx, userName);

    operationLogger.info("user_login", {
      operator_ip: ctx.ip,
      operator_name: userName,
      login_result: true,
      login_method: "sso_bind"
    });

    logger.info(`[SSO] User ${userName} bound to SSO sub: ${ssoSub}`);
    ctx.body = token;
  }
);

// [Logged-in user] Bind SSO to current session account (no password needed)
router.post(
  "/bind-current",
  permission({ level: ROLE.USER }),
  async (ctx: Koa.ParameterizedContext) => {
    if (!systemConfig?.ssoEnabled) {
      ctx.status = 403;
      ctx.body = "SSO is not enabled";
      return;
    }

    if (!ctx.session) throw new Error("Session is null");

    const ssoSub = ctx.session["ssoBindSub"];
    const ssoBindTimestamp = ctx.session["ssoBindTimestamp"];

    if (!ssoSub) {
      throw new Error("No pending SSO binding session");
    }

    if (!ssoBindTimestamp || Date.now() - ssoBindTimestamp > 10 * 60 * 1000) {
      delete ctx.session["ssoBindSub"];
      delete ctx.session["ssoBindClaims"];
      delete ctx.session["ssoBindTimestamp"];
      ctx.session.save();
      throw new Error("SSO binding session expired");
    }

    const alreadyBound = userSystem.getUserBySsoSub(ssoSub);
    if (alreadyBound) {
      delete ctx.session["ssoBindSub"];
      delete ctx.session["ssoBindClaims"];
      delete ctx.session["ssoBindTimestamp"];
      ctx.session.save();
      throw new Error("This SSO account is already bound to another user");
    }

    const userName = ctx.session["userName"];
    if (!userName) throw new Error("No logged-in user in session");

    const user = userSystem.getUserByUserName(userName);
    if (!user) throw new Error("User not found");

    if (user.ssoBound && user.ssoSub) {
      throw new Error("This account is already bound to another SSO provider");
    }

    await userSystem.bindSso(user.uuid, ssoSub);

    delete ctx.session["ssoBindSub"];
    delete ctx.session["ssoBindClaims"];
    delete ctx.session["ssoBindTimestamp"];
    ctx.session.save();

    operationLogger.info("user_login", {
      operator_ip: ctx.ip,
      operator_name: userName,
      login_result: true,
      login_method: "sso_bind_current"
    });

    logger.info(`[SSO] User ${userName} bound to SSO sub (current session): ${ssoSub}`);
    ctx.body = true;
  }
);

// [Admin] Unbind SSO from a user
router.put(
  "/unbind",
  permission({ level: ROLE.ADMIN }),
  validator({ body: { uuid: String } }),
  async (ctx: Koa.ParameterizedContext) => {
    const uuid = String(ctx.request.body.uuid);
    const user = userSystem.getUserByUuid(uuid);
    if (!user) throw new Error("User not found");

    await userSystem.unbindSso(uuid);

    operationLogger.log("sso_unbind", {
      operator_ip: ctx.ip,
      operator_name: ctx.session?.["userName"],
      target_user_name: user.userName
    });

    logger.info(`[SSO] Admin unbound SSO for user ${user.userName}`);
    ctx.body = true;
  }
);

export default router;
