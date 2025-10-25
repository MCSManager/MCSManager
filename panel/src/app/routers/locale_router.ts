import Koa from "koa";
import Router from "@koa/router";
import { i18next } from "../i18n";
import remoteService from "../service/remote_service";

const router = new Router({ prefix: "/locales" });

router.get('/get', async (ctx: Koa.Context): Promise<void> => {
  const [user_uuid, code] = [
    ctx.query.user_uuid as string,
    ctx.query.code as string
  ];
  ctx.status = 200;
  ctx.type = "application/json";
  ctx.body = i18next.ReadLanguageFile(code)
  remoteService.changeDaemonLanguage(user_uuid, code);
})

export default router;
