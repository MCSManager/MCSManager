# 疑虑：panel `validator()` 中间件把 handler 抛出的错误转成 400

## 触发路由
- `POST /api/auth/login`(IP 被封禁分支, `login_router.ts`)
- `ALL /api/auth/install`(已安装分支, `login_router.ts`)
- 以及**所有**带 `validator({...})` 中间件且 handler 在自身 try/catch 之外抛 `Error` 的路由。

## 链路分析

`panel/src/app/middleware/validator.ts` 的中间件实现:

```ts
return async (ctx, next) => {
  try {
    parameter["params"] && check(ctx.params, parameter["params"]);
    parameter["query"] && check(ctx.query, parameter["query"]);
    if (parameter["body"] && Object.keys(parameter["body"]).length > 0)
      check(ctx.request.body, parameter["body"]);
    return await next();          // <-- next 即真正的 handler
  } catch (err: any) {
    ctx.status = 400;
    ctx.body = `${err.message || "Request parameters are incorrect"}`;
  }
};
```

关键点在于 `return await next()` 也被同一个 `try/catch` 包裹了。因此当 handler(下游中间件)
本身抛出 `Error` 时,异常会"冒泡"到 `validator` 的 catch,从而:

- `ctx.status` 被设为 **400**
- `ctx.body` 被设为 `err.message`(字符串)
- 经 `protocol.middleware` 字符串分支包装成信封 `{status:400, data: <错误消息>, time}`

## 实测表现(见 `panel/src/app/routers/login_router.test.ts`)

| 场景 | 抛出位置 | 最终信封 status |
| --- | --- | --- |
| `/auth/login` 账号/密码错误 | handler 内部 `try{ ctx.body = login(...) }catch{}` 自行捕获,设 `ctx.body = Error` | **500**(protocol 的 Error 分支) |
| `/auth/login` IP 被封禁 (`throw new Error($t("TXT_CODE_router.login.ban"))`) | handler **在** try 块**之外**抛出 | **400**(被 validator 的 catch 捕获) |
| `/auth/install` 已安装 (`throw new Error($t("TXT_CODE_router.user.installed"))`) | handler **在** try 块**之外**抛出 | **400**(被 validator 的 catch 捕获) |

## 疑虑点

1. **HTTP 语义不符**: "IP 被封禁" 与 "账号已创建"在语义上分别是 **403/429** 与 **409**,
   并非 "Bad Request(400)"。当前实现把它们一律报告为 400。
2. **同一类 handler 错误,400/500 不一致**: 取决于 handler 是否把 `login(...)` 包在 try/catch、
   以及 `throw` 写在 try 块内还是块外——同一个路由的两种错误分支,信封 status 可能分别是 400 与 500。
3. 前端(`widgets/LoginCard.vue` 等)主要用 `result.value`(即信封 `data`,如 `"NEED_2FA"`)做分支,
   **不依赖** status,所以**功能上不致出错**;但 HTTP 状态语义层面存在"借道 400"的设计味道。

## 待后续定夺(暂不改代码)

- 是否应让 `validator()` 中间件**只**捕获**校验自身**的异常,不包裹 `await next()`
  (即把 `return await next();` 移到 `try` 之外,只保留三个 `check(...)` 在 try 内),
  从而让 handler 抛出的错误按设计走 protocol 的 Error 分支(500)或被各自 handler 自行处理?
- 或者为 handler 常见"业务错误"统一一个明确的错误码契约(如统一 500 或专门的 `data.apiError` 标记)
  以替代"哪个中间件恰好 catch 到"决定 status。

测试已按**当前真实行为**(400 + `data` 文本)编写并断言通过,未对源码做改动。本文档供你后续评估。
