# 疑虑：panel `mod_manager_router.ts` 把 `canFileManager` 门控的 403 错误退化为 500

> **【已修复 FIXED】** — 该 bug 已按本文方案修复（`mod_manager_router.ts` 顶级 `canFileManager===false` 门控由 `ctx.body = new Error(...)` 改为 `ctx.body = $t(...)` 字符串体，保留 403），并用 TDD 验证（撤销则测试在 500 失败、修复后 403 通过）。保留本文以记录该缺陷的链路分析。参见提交 `test(panel): cover mod_manager; fix canFileManager gate 403-vs-500`。

## 触发代码
`panel/src/app/routers/mod_manager_router.ts` 顶部的 `router.use(...)` 门控分支
（与 `filemananger_router.ts` **完全相同**的写法，见下）。

## 链路分析

修复 `filemananger_router.ts` 时发现其顶部门控写作:

```ts
// filemananger_router.ts (修复前)
router.use(async (ctx, next) => {
  ...
  if (systemConfig?.canFileManager === false && getUserPermission(ctx) < 10) {
    ctx.status = 403;
    ctx.body = new Error($t("TXT_CODE_router.file.off"));  // <-- Error 实例
    return;
  }
  ...
});
```

`ctx.body` 设为 `Error` 实例后,`protocol.middleware` 的 Error 分支会**覆盖** `ctx.status`
为 500(见 `panel/src/app/middleware/protocol.ts` 的 `if (ctx.body instanceof Error)`
分支)——于是 API 实际返回信封 `{500, <消息>}` 而非文档意图的 403。
`filemananger_router.ts` 已修复为字符串 body(`ctx.body = $t("TXT_CODE_router.file.off")`),
保留 403(与其同文件中 `isHaveInstanceByUuid` 那条用字符串 body 的兄弟分支一致)。

`mod_manager_router.ts` 顶部门控**使用了与修复前 `filemananger_router.ts` 完全相同的
`ctx.body = new Error($t("TXT_CODE_router.file.off"))` 写法**,因此**存在同样的
403 被退化为 500 的缺陷**。

## 待修复（同一行改动，待 mod_manager 路由测试时一并处理）

将 `mod_manager_router.ts` 该门控分支的:

```ts
ctx.body = new Error($t("TXT_CODE_router.file.off"));
```

改为:

```ts
ctx.body = $t("TXT_CODE_router.file.off");
```

(与 `filemananger_router.ts` 现在的修法一致。)

## 为何未直接改

`mod_manager_router` 尚未有测试覆盖(本批次只覆盖了 `filemananger_router` 与
`daemon_router`)。为避免在无测试验证的代码上做静默改动,这里仅记录疑虑。待
mod_manager 路由测试编写到该门控分支时,按上述一行改动修复并断言 `env.status === 403`。

> 相关修复见提交:`fix(panel): filemananger_router canFileManager gate 403-vs-500`。
> 相关协议行为另见 [protocol 把 falsey/错误体当 500/400 的问题](panel-protocol-falsey-is-500.md) 与
> [validator 把 handler 抛错转成 400](panel-login_router-validator-error-status.md)。
