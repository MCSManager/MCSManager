import { Context } from "koa";
import userSystem from "../service/user_service";
import { ROLE } from "../entity/user";

/**
 * Prevent users from performing unrestricted file uploads using koa-body,
 * occupying machine disk space.
 */
export async function preCheckMiddleware(ctx: Context, next: () => Promise<void>) {
  const headers = ctx.request?.headers;
  const contentType = headers?.["content-type"] ?? "";
  const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
  const session = ctx.session || ({} as Record<string, any>);
  const user = userSystem.getInstance(session["uuid"]);
  const isAdmin = user?.permission === ROLE.ADMIN;

  if (isMultipart && !isAdmin) {
    throw new Error("Access denied: Invalid multipart/form-data request!");
  }
  return await next();
}
