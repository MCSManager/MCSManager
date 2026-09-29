# Test Doubts — 待确认的测试疑虑索引

本目录记录测试过程中"应通过却未通过"但因**需求或链路存在歧义、或环境限制**而**未改动代码**的条目。
每条疑虑一个独立 md 文件，中文撰写，文件名 `<router>-<route-or-event>.md`。

测试定论原则（见 `docs/superpowers/specs/2026-09-29-backend-route-tests-design.md` §5）：

1. 先写描述正确行为的断言。
2. 跑测试。
3. 测试失败且判定为**真实 bug** → 修复源码（最小改动），不写本文档。
4. 测试失败但**需求/链路存在歧义或环境限制** → **不改代码**，在此目录写中文疑虑文档，并把对应 `it` 标记 `.skip`（注明疑虑文档引用）或 `.fails`。

## 疑虑清单（随提交更新）

（每次提交相关批次时由主会话在此追加条目；子 Agent 不并发编辑本文件。）

- [panel: `validator()` 把 handler 抛错转成 400](panel-login_router-validator-error-status.md) — `/auth/login` IP 封禁、`/auth/install` 已安装等"非校验类"handler 错误被 `validator` 的 try/catch 捕成信封 400，HTTP 语义存疑；前端按 `data` 判断不影响功能，未改代码。
- [panel: protocol 把 falsey 响应体当 500](panel-protocol-falsey-is-500.md) — `confirm2fa` 等返回 `ctx.body=false` 的分支被 `protocol.middleware` 退化为 `{500, null}`，`false`/业务否 与 失败 语义无法区分；未改代码。
- [panel: settings `PUT /setting` SSO verifyIssuer 不可单测](panel-settings_router-put_setting.md) — handler 用运行时 `require("../service/sso_service")` 加载 `.ts`，vitest 0.33 node 环境下原生 `require()` 不被 `vi.mock` 拦截；前置的 https/issuer 校验分支已覆盖，verifyIssuer 直调用例 `it.skip` 并引用本文。
- [panel: mod_manager `canFileManager` 门控 403 被退化为 500](panel-mod_manager-canFileManager-403-vs-500.md) — 【已修复】与 `filemananger_router.ts(已修)` 相同的 `ctx.body = new Error(...)` 写法被 protocol 覆写为 500；已按字符串 body 改为 403 并 TDD 验证。保留文档记录链路。
- [panel: instance_admin 每实例校验 throw vs 403 门控](panel-instance_admin-perm-throw-vs-gate-403.md) — `instance_admin GET /` 把归属校验放 handler 体内 throw，非所有者返回 500 错误信封，与 instance_operate/java_manager 的 403 门控不一致；统一各实例路由的越权返回码契约待评估，暂未改代码。
