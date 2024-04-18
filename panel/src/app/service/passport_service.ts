import Koa from "koa";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import userSystem from "./user_service";
import { timeUuid } from "./password";
import { GlobalVariable, toText } from "common";
import { systemConfig } from "../setting";
import { logger } from "./log";
import { User } from "../entity/user";
import { $t } from "../i18n";

export const BAN_IP_COUNT = "banip";
export const LOGIN_FAILED_KEY = "loginFailed";
export const ILLEGAL_ACCESS_KEY = "illegalAccess";
export const LOGIN_COUNT = "loginCount";
export const LOGIN_FAILED_COUNT_KEY = "loginFailedCount";

export function login(
  ctx: Koa.ParameterizedContext,
  userName: string,
  passWord: string,
  twoFACode?: string
): string {
  // record the number of login requests
  GlobalVariable.set(LOGIN_COUNT, GlobalVariable.get(LOGIN_COUNT, 0) + 1);
  const ip = systemConfig?.reverseProxyMode
    ? toText(ctx.header["x-real-ip"])
    : ctx.socket.remoteAddress;

  // check user information
  try {
    userSystem.checkUser({ userName, passWord }, twoFACode);
    // The number of errors to reset this IP after successful login
    const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);
    if (ipMap) delete ipMap[ip || ""];

    // Session Session state changes to logged in
    const user = userSystem.getUserByUserName(userName);
    if (!user) throw new Error($t("TXT_CODE_router.login.nameOrPassError"));
    if (!ctx.session) throw new Error("Session is Null!");

    user.loginTime = new Date().toLocaleString();
    ctx.session["login"] = true;
    ctx.session["userName"] = userName;
    ctx.session["uuid"] = user.uuid;
    ctx.session["token"] = timeUuid();
    ctx.session.save();
    logger.info($t("TXT_CODE_42036f92"));
    logger.info(`[LOGIN] IP: ${ip} Login ${userName} successful!`);
    logger.info(`[LOGIN] Token: ${ctx.session["token"]}`);
    logger.info($t("TXT_CODE_42036f92"));
    return ctx.session["token"];
  } catch (err) {
    // record the number of login failures
    GlobalVariable.set(LOGIN_FAILED_COUNT_KEY, GlobalVariable.get(LOGIN_FAILED_COUNT_KEY, 0) + 1);
    if (ctx.session) {
      ctx.session["login"] = null;
      ctx.session["token"] = null;
      ctx.session.save();
    }
    logger.info(`[LOGIN] IP: ${ip}, Try login ${userName} failed!`);
    throw err;
  }
}

export async function bind2FA(ctx: Koa.ParameterizedContext) {
  if (!ctx.session) throw new Error("Session is Null!");
  const userName = ctx.session["userName"];
  const user = userSystem.getUserByUserName(userName);
  if (!user) throw new Error("User is Null!");
  try {
    const secret = authenticator.generateSecret();
    const qrCode = await QRCode.toDataURL(
      authenticator.keyuri(userName, "MCSManager Panel", secret)
    );
    userSystem.edit(user.uuid, { secret, open2FA: false });
    return qrCode;
  } catch (err) {
    user.secret = "";
  }
}

export async function confirm2FaQRCode(userUuid: string, isEnable: boolean) {
  await userSystem.edit(userUuid, {
    open2FA: isEnable
  });
}

export function check(ctx: Koa.ParameterizedContext) {
  if (!ctx.session) return false;
  if (ctx.session["login"] && ctx.session["userName"] && ctx.session["token"]) return true;
  return false;
}

export function logout(ctx: Koa.ParameterizedContext): boolean {
  if (!ctx.session) return false;
  ctx.session["login"] = null;
  ctx.session["userName"] = null;
  ctx.session["uuid"] = null;
  ctx.session["token"] = null;
  ctx.session.save();
  return true;
}

export async function register(
  ctx: Koa.ParameterizedContext,
  userName: string,
  passWord: string,
  permission: number
) {
  let f = true;
  // Check for duplicate usernames.
  userSystem.objects.forEach((user) => {
    if (user && user.userName == userName) f = false;
  });
  if (f) {
    // Next. UUID and other data will be automatically generated.
    await userSystem.create({
      userName,
      passWord,
      permission
    });
    return true;
  }
  return false;
}

export function getUserPermission(ctx: Koa.ParameterizedContext): number {
  let user: User | undefined | null = undefined;
  if (isApiRequest(ctx)) {
    user = getUuidByApiKey(getApiKey(ctx));
  } else {
    user = userSystem.getInstance(ctx.session?.["uuid"] || "");
  }
  if (!user) return 0;
  return user.permission ?? 0;
}

export function getUserNameBySession(ctx: Koa.ParameterizedContext): string {
  if (isApiRequest(ctx)) {
    const user = getUuidByApiKey(getApiKey(ctx));
    return user ? user.userName : "";
  }
  return ctx.session?.["userName"];
}

export function getUserUuid(ctx: Koa.ParameterizedContext): string {
  if (isApiRequest(ctx)) {
    const user = getUuidByApiKey(getApiKey(ctx));
    if (user && user.uuid) {
      return user.uuid;
    } else {
      return "";
    }
  }
  return ctx.session?.["uuid"] || "";
}

export function getToken(ctx: Koa.ParameterizedContext): string {
  return ctx.session?.["token"] || "";
}

export function isAjax(ctx: Koa.ParameterizedContext) {
  return (
    ctx.header["x-requested-with"] &&
    ctx.header["x-requested-with"].toString().toLocaleLowerCase() === "xmlhttprequest"
  );
}

export function checkBanIp(ctx: Koa.ParameterizedContext) {
  if (!GlobalVariable.map.has(LOGIN_FAILED_KEY)) GlobalVariable.set(LOGIN_FAILED_KEY, {});
  // This IpMap also needs to be used when logging in
  const ipMap = GlobalVariable.get(LOGIN_FAILED_KEY);

  const ip =
    (systemConfig?.reverseProxyMode ? toText(ctx.header["x-real-ip"]) : ctx.socket.remoteAddress) ||
    "";

  if (ipMap[ip] > 10 && systemConfig?.loginCheckIp === true) {
    if (ipMap[ip] != 999) {
      // record the number of bans
      GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 0) + 1);
      setTimeout(() => {
        delete ipMap[ip];
        // delete the number of bans
        GlobalVariable.set(BAN_IP_COUNT, GlobalVariable.get(BAN_IP_COUNT, 1) - 1);
      }, 1000 * 60 * 10);
    }
    ipMap[ip] = 999;
    return false;
  }
  if (!isNaN(Number(ipMap[ip]))) ipMap[ip] = Number(ipMap[ip]) + 1;
  else ipMap[ip] = 1;
  return true;
}

export function getUuidByApiKey(apiKey: string) {
  const pageData = userSystem.getQueryWrapper().selectPage(
    {
      apiKey
    },
    1,
    1
  );
  if (pageData.total === 1) {
    return pageData.data[0];
  }
  return null;
}

export function isApiRequest(ctx: Koa.ParameterizedContext) {
  return ctx.query.apikey ? true : false;
}

export function getApiKey(ctx: Koa.ParameterizedContext) {
  return String(ctx.query.apikey);
}
