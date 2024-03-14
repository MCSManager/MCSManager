import Koa from "koa";
import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import { register } from "../service/passport_service";
import userSystem from "../service/user_service";
import { $t } from "../i18n";
import { ROLE } from "../entity/user";

const router = new Router({ prefix: "/auth" });

// Add user
router.post(
  "/",
  permission({ level: ROLE.ADMIN }),
  validator({ body: { username: String, password: String, permission: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.request.body.username);
    const passWord = String(ctx.request.body.password);
    const permission = Number(ctx.request.body.permission);
    if (!userSystem.validatePassword(passWord))
      throw new Error($t("TXT_CODE_router.user.invalidPassword"));
    if (userSystem.existUserName(userName))
      throw new Error($t("TXT_CODE_router.user.existsUserName"));
    ctx.body = await register(ctx, userName, passWord, permission);
  }
);

// Delete user
router.del("/", permission({ level: ROLE.ADMIN }), async (ctx: Koa.ParameterizedContext) => {
  const uuids = ctx.request.body;
  try {
    for (const iterator of uuids) {
      await userSystem.deleteInstance(iterator);
    }
    ctx.body = true;
  } catch (error: any) {
    ctx.throw(500, $t("TXT_CODE_router.user.deleteFailure") as string);
  }
});

// User search function
router.get(
  "/search",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { page: Number, page_size: Number } }),
  async (ctx: Koa.ParameterizedContext) => {
    const userName = String(ctx.query.userName);
    const role = String(ctx.query.role);
    const page = Number(ctx.query.page);
    const pageSize = Number(ctx.query.page_size);
    const condition: any = {};
    if (userName) condition["userName"] = `%${userName}%`;
    if (role) condition["permission"] = Number(role);
    let resultPage = userSystem.getQueryWrapper().selectPage(condition, page, pageSize);
    // make a copy, delete redundant
    resultPage = JSON.parse(JSON.stringify(resultPage));
    resultPage.data.forEach((v) => {
      v.passWord = "";
      v.salt = "";
    });
    ctx.body = resultPage;
  }
);

export default router;
