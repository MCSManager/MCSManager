import { Context } from "koa";

/**
 * Prevent users from performing unrestricted file uploads using koa-body,
 * occupying machine disk space.
 */
export async function preCheckMiddleware(ctx: Context, next: () => Promise<void>) {
  const headers = ctx.request?.headers;
  const contentType = headers?.["content-type"] ?? "";
  const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

  if (isMultipart) {
    throw new Error("Access denied: Invalid multipart/form-data request!");
  }
  return await next();
}
