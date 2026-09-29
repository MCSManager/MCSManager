# 疑虑：panel `settings_router` PUT `/overview/setting` 的 SSO `verifyIssuer` 分支无法用 `vi.mock` 拦截

## 触发路由
- `PUT /api/overview/setting`(`settings_router.ts`)，SSO OIDC 启用分支。

## 链路分析

`settings_router.ts` 的 PUT `/setting` handler 在检测到需要校验 SSO Issuer 时,
使用 CommonJS `require` **动态加载** `sso_service`,而非 ES `import`:

```ts
const needVerify =
  wantEnable &&
  Boolean(issuer?.trim() && clientId?.trim() && clientSecret?.trim()) &&
  (!systemConfig.ssoEnabled || oidcCredentialsChanged);
if (needVerify) {
  const { verifyIssuer } = require("../service/sso_service");   // <-- 运行期 require
  await verifyIssuer(issuer, clientId, clientSecret);
}
```

测试侧已按本测试套约定对 `../service/sso_service` 做了 inline 工厂 mock:

```ts
vi.mock("../service/sso_service", () => ({ verifyIssuer: vi.fn(async () => undefined) }));
```

但 vitest 0.33 在 `environment: "node"` 下不会拦截 handler 内的**运行期 `require()`**:
该 `require` 走 Node 原生模块解析器,只能解析 `.js/.json/.node`,无法解析 `.ts`,
导致 `Cannot find module '../service/sso_service'`(MODULE_NOT_FOUND),并冒泡为信封 `{500, "Cannot find module ..."}`。

`vi.mock` 只拦截被 Vite/vitest 转译管线的 `import`(含静态 `import` 与 `await import(...)`),
并不会接管由 Node `Module._resolveFilename` 走的原生 `require`。因此本例的 `require("../service/sso_service.ts")`
在 vitest 环境里既拿不到 mock、也加载不到真实 `.ts`。

## 影响范围

- 仅 `PUT /overview/setting` 的 SSO OIDC **启用 + 凭据变更**分支(需校验 Issuer 的那条路径)无法走整到断言。
- 同一 handler 内在 `require` **之前** 的校验分支(`ssoIssuer` 必须为 `https://`、必填字段缺失等)
  仍可正常断言,并已在
  `panel/src/app/routers/settings_router.test.ts` 中收录为通过用例
  (SSO OIDC branch: rejects a non-https issuer URL before reaching verifyIssuer)。
- `upgrade_router` 等其他通过 `import` 引用 `upgrade_service` 的路由不受此限制。

## 既有代码的取舍

该 `require` 看上去是为了把 `openid-client` 这类依赖**按需加载**(避免在未启用 SSO 的面板启动时
即加载整套 OIDC 库)。这是合理的运行期惰性加载模式,只是与 vitest 的 mock 机制不兼容;
不属于路由代码的缺陷,故**未改源码**。

## 待后续定夺(暂不改代码)

可能的解决方向(任一均不在本批次范围):
- 改为 `const { verifyIssuer } = await import("../service/sso_service")`,让 vitest 可拦截;
- 提供一个 `vitest.config.ts` 的 `server.deps.inline` 将 `sso_service` 纳入转译管线后再配 mock;
- 在 vitest 环境里向 handler 注入 stub `require`(依赖全局 hook,较 hacky)。

测试已按**当前可达的行为**(SSO OIDC 分支进入 -> 非 https 的 issuer 校验抛错 -> 500)断言通过;
`verifyIssuer` 直调分支被标记为 `it.skip` 并引用本文档。
