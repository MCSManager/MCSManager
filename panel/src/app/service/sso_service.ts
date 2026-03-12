import * as oidc from "openid-client";
import Koa from "koa";
import { systemConfig } from "../setting";
import { logger } from "./log";
import crypto from "crypto";

let cachedConfig: oidc.Configuration | null = null;
let cachedIssuer = "";

export async function getOIDCConfig(): Promise<oidc.Configuration> {
  if (!systemConfig) throw new Error("System config not initialized");
  if (!systemConfig.ssoEnabled) throw new Error("SSO is not enabled");
  if (!systemConfig.ssoIssuer || !systemConfig.ssoClientId || !systemConfig.ssoClientSecret) {
    throw new Error("SSO configuration is incomplete");
  }

  if (cachedConfig && cachedIssuer === systemConfig.ssoIssuer) {
    return cachedConfig;
  }

  try {
    const issuerUrl = new URL(systemConfig.ssoIssuer);
    cachedConfig = await oidc.discovery(issuerUrl, systemConfig.ssoClientId, systemConfig.ssoClientSecret);
    cachedIssuer = systemConfig.ssoIssuer;
    logger.info("[SSO] OIDC discovery completed for: " + systemConfig.ssoIssuer);
    return cachedConfig;
  } catch (err: any) {
    cachedConfig = null;
    cachedIssuer = "";
    logger.error("[SSO] OIDC discovery failed: " + err.message);
    throw new Error("OIDC discovery failed. Check server logs for details.");
  }
}

export function clearOIDCCache() {
  cachedConfig = null;
  cachedIssuer = "";
}

export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function buildAuthorizationUrl(
  state: string,
  nonce: string,
  codeVerifier: string,
  ctx?: Koa.ParameterizedContext
): Promise<string> {
  const config = await getOIDCConfig();
  const callbackUrl = getCallbackUrl(ctx);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid profile email",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  return url.href;
}

export async function handleCallback(
  callbackUrl: URL,
  expectedState: string,
  expectedNonce: string,
  codeVerifier: string
): Promise<{ sub: string; claims: Record<string, unknown> }> {
  const config = await getOIDCConfig();

  const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState,
    expectedNonce,
    idTokenExpected: true
  });

  const claims = tokens.claims();
  if (!claims || !claims.sub) {
    throw new Error("Invalid id_token: missing sub claim");
  }

  return {
    sub: String(claims.sub),
    claims: claims as Record<string, unknown>
  };
}

export function getCallbackUrl(ctx?: Koa.ParameterizedContext): string {
  if (!systemConfig) throw new Error("System config not initialized");
  if (systemConfig.ssoCallbackUrl) return systemConfig.ssoCallbackUrl;
  const prefix = systemConfig.prefix || "";
  if (ctx) {
    const proto = (ctx.get("X-Forwarded-Proto") || ctx.protocol || "http").split(",")[0].trim();
    const host = (ctx.get("X-Forwarded-Host") || ctx.get("Host") || "").split(",")[0].trim();
    if (host) {
      return `${proto}://${host}${prefix}/api/auth/sso/callback`;
    }
  }
  const port = systemConfig.httpPort || 23333;
  return `http://localhost:${port}${prefix}/api/auth/sso/callback`;
}

export function getPublicSsoConfig() {
  if (!systemConfig) return null;
  if (!systemConfig.ssoEnabled) return null;
  return {
    enabled: systemConfig.ssoEnabled,
    onlyMode: systemConfig.ssoOnlyMode,
    autoRedirect: systemConfig.ssoAutoRedirect,
    providerName: systemConfig.ssoProviderName,
    iconUrl: systemConfig.ssoIconUrl
  };
}
