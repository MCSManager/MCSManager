import { Context } from "koa";
import { globalConfiguration } from "../entity/config";
import logger from "../service/log";
import { missionPassport } from "../service/mission_passport";
import uploadManager from "../service/upload_manager";
import { proxyIncomingMessage } from "../utils/speed_limit";

export function isUploadRequest(ctx: Context) {
  const headers = ctx.request?.headers;
  const contentType = headers?.["content-type"] ?? "";
  return contentType.toLowerCase().includes("multipart");
}

/**
 * Prevent users from performing unrestricted file uploads using koa-body,
 * occupying machine disk space.
 */
export async function uploadFileCheckMiddleware(ctx: Context, next: () => Promise<void>) {
  try {
    const isMultipart = isUploadRequest(ctx);
    const error = new Error("Access denied: Invalid multipart request!");

    if (isMultipart) {
      let uploadKey = "";

      // For all file upload interfaces, the last path in the URL must be the upload key.
      const fullUrl = ctx.origin + ctx.url;
      const urlObj = new URL(fullUrl);
      const pathSegments = urlObj.pathname.trim().split("/").filter(Boolean);
      uploadKey = pathSegments[pathSegments.length - 1] || "";

      const pieceWriter = uploadManager.get(uploadKey);
      const uploadMission = missionPassport.getMission(uploadKey, "upload");

      if (pieceWriter || uploadMission) {
        return await next();
      } else {
        throw error;
      }
    }
    return await next();
  } catch (e: any) {
    logger.error("uploadFileCheckMiddleware error: " + e?.message);
    throw e;
  }
}

export async function uploadSpeedLimitMiddleware(ctx: Context, next: () => Promise<void>) {
  const isUpload = isUploadRequest(ctx);
  if (isUpload) {
    const rate = Number(globalConfiguration.config.uploadSpeedRate) || 0;
    if (rate <= 0) return await next();
    const incomingMessage = proxyIncomingMessage(ctx.req, rate);
    ctx.req = incomingMessage;
  }
  return await next();
}
