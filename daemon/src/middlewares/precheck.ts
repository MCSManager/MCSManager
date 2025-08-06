import { Context } from "koa";
import { missionPassport } from "../service/mission_passport";
import logger from "../service/log";
import uploadManager from "../service/upload_manager";

/**
 * Prevent users from performing unrestricted file uploads using koa-body,
 * occupying machine disk space.
 */
export async function uploadFileCheckMiddleware(ctx: Context, next: () => Promise<void>) {
  try {
    const headers = ctx.request?.headers;
    const contentType = headers?.["content-type"] ?? "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const error = new Error("Access denied: Invalid multipart/form-data request!");

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
