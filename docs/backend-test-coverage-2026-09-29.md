# MCSManager 后端路由测试 — 覆盖与回溯总结 (2026-09-29)

> 分支：`feat/backend-route-tests`。本文件是 `docs/superpowers/specs/2026-09-29-backend-route-tests-design.md` 的设计与 `docs/superpowers/plans/2026-09-29-backend-route-tests.md` 的实现计划的执行结项报告。

## 1. 结论

为后端**每一个路由/接口**建立了 vitest 集成/单元测试，以 TDD 方式推进，每步提交可回溯：

- **panel (Web 后端, Koa)**：17 个活跃 router 文件 **全部覆盖**（`socket_router` 是死代码，已排除）。
- **daemon (节点 worker, 双传输)**：12 个 router 文件 **全部覆盖**（11 个 socket.io 事件 router + 1 个 HTTP router）。
- **测试总数**：common 9 + panel 193（+1 skipped）+ daemon 113 = **315 通过 / 1 skipped**，**全绿**。
- **生产构建健康**：`panel`、`daemon` 的 webpack 构建（项目的类型检查）**仍编译成功**。

运行：

```bash
cd common  && npm test   # 9 passed
cd panel   && npm test   # 193 passed | 1 skipped
cd daemon  && npm test   # 113 passed
```

## 2. 测试基建（一次性建好，全部路由复用）

### panel — 加载单个真实 `@koa/router` + supertest

`panel/test/harness/`：
- `app.ts` `createTestApp([router])`：在新的 Koa app 上挂**假 session 中间件**（测试经 `x-test-session-id` 注入身份）+ 轻量 JSON body 解析 + **真实 `protocol` 信封中间件**，返回 `app.callback()` 供 supertest 驱动；`unwrap(res)` 解 `{status,data,time}`。
- `auth.ts` `asAdmin/asUser/asApiKey/asPublic/tokenQuery`：注入已登录会话（含 token），让**真实 `permission` 中间件**真的走鉴权/门控（而非桩替换）。
- `mocks.ts`：边界服务工厂（子 Agent 用内联 `vi.mock` 注入）：`mockUserSystem`/`mockRemoteService`/`mockOperationLogger`/`mockSetting`/`mockPassportService`/`mockLog`。

### daemon — fake socket + `routerApp` 事件驱动 + supertest(HTTP)

`daemon/test/harness/`：
- `router.ts` `invoke`（handler 模式，跳过门控）/`dispatch`（gate 模式，按序跑 `routerApp.use` 再 emit）/`packetsFor`/`flush`/`fakeSocket`：驱动 socket.io 事件而无需真实 socket.io server。
- `http.ts` `createHttpApp()`：supertest 驱动真实 `initKoa()`（用于 5 个 Koa 路由）。
- `mocks.ts`：`mockGlobalConfig`/`mockInstanceSystem`/`fakeInstance`/`mockDocker`/`mockMissionPassport`。

### 关键生产改动（为可测 + 构建健康）

1. **daemon：抽离 `service/router_app.ts`**（无 router 循环依赖）。原 `service/router.ts` 既定义 `routerApp` 单例、又在文件底部以静态 `import` 加载所有 router，依赖 CJS `require` 顺序——vitest 的 ESM 会把那些 import 提升到 `routerApp` 初始化之前，导致 handler 加载到 `undefined` 的 `routerApp` 而崩。将单例抽到无依赖的 `router_app.ts`、`router.ts` re-export 并保留注册副作用，各 router 改从 `router_app` 直接导入→打破循环。**运行时行为不变**（webpack CJS 不受影响），daemon 构建通过。
2. **panel/daemon tsconfig `exclude: ["src/**/*.test.ts","test/**"]`**：`ts-loader` 会类型检查整个 `src/**/*` 程序，co-located `*.test.ts` 及其 import 的 `test/harness/*` 会被生产构建类型检查并报错（parsedMethods 枚举、supertest 类型等）。排除后生产构建只覆盖真实源；vitest 仍经自身 include 发现并运行测试（esbuild，无类型门）。两端构建均恢复绿。
3. **3 处确认 bug 修复**（见 §4）。

## 3. 覆盖矩阵

### panel（19 文件：17 router + harness/smoke + 既有 login_ban）
| router | 测试数 | 覆盖要点 |
| --- | --- | --- |
| login_router | 10 | login(token/ban/NEED_2FA/错密码)、logout、login_info、status、install、proxy(admin/非admin) |
| general_user_router | 11 | token(Ajax/500)、overview、update(token 匹配/不匹配/非Ajax)【焦点#1】、api、bind2fa、confirm2fa |
| manage_user_router | 6 | create、弱口令/重名 400、delete、search(脱敏+分页裁剪) |
| user_overview_router | 4 | edit、password-reset 审计、非admin 403、overview |
| instance_admin_router | 9 | detail(所有者/非所有者)、validator 400、new、multi_open(multiOperationForwarding 按 daemon 聚合)、quick_install_list、forward、upload 门控 |
| instance_operate_router | 7 | open/stop/restart/kill/command 经 RemoteRequest 转发、per-instance 门控 403、validator 400 |
| instance_exchange_router | 7 | POST/ request_action、GET /sso(302+校验失败)、POST /request_buy_instance |
| overview_router | 7 | daemon 扇出、apikey 禁用 403 / 启用+admin 200【焦点#2】、operation_logs |
| settings_router | 12(+1skip) | GET/PUT setting、install、layout CRUD、upload_assets、refresh_business_mode |
| upgrade_router | 14 | panel/daemon 自升级 info/执行(透传 updateSourceUrl)、validator 400、未知 uuid 500、非admin 403 |
| filemananger_router | 18 | 各 /files 组转发 file/* 事件、per-instance 门控(canFileManager/isHaveInstance)、validator 400、download/upload 注册 passport |
| daemon_router | 11 | remote_services CRUD/instances/system/link_remote_service、非admin 403、validator 400 |
| environment_router | 12 | image/containers/networkModes/进度/image_platforms 转发、dockerhub_image_platforms 走 axios(不走 RemoteRequest)、validator/非admin |
| sso_router | 21 | config、authorize(302/封禁/未启用)、callback(OIDC/OAuth2/失败/无效会话)、bind-status、bind、bind-current、unbind |
| mod_manager_router | 8 | mc_versions、list、info、versions、toggle、validator 400、per-instance/canFileManager 门控 403 |
| schedule_router | 5 | list/register/delete 转发、per-instance 403、validator 400 |
| java_manager_router | 7 | list/add/download/using/delete 转发、per-instance 403、validator 400 |
| (既有) login_ban | 23 | 纯函数（既有，未改动） |
| harness/smoke | 2 | login_info/status 信封 |

### daemon（13 文件：12 router + harness/smoke）
| router | 测试数 | 传输/覆盖 |
| --- | --- | --- |
| auth_router | 6 | socket:对/错 key、IP 白名单、顶层 gate silent drop【焦点#4】、connection 6s 超时 |
| info_router | 4 | socket:overview(version/实例数/docker 平台/降级)、setting 校验+持久化(越界 port 忽略) |
| passport_router | 2 | socket:register 成功/缺参 500 |
| Instance_router | 17 | socket:select/overview/section/detail、open/stop/restart/kill/command(execPreset)、new/update/delete/forward、实例存在性 gate、运行中实例禁止删除 |
| stream_router | 9 | socket:stream/auth(passport)、detail、input/resize(execPreset)、write(process.write)、stream gate 拦截非 stream 会话 |
| environment_router | 12 | socket:images/containers/networkModes(+host/none 补全)、progress(builderProgress)、new_image(预响应+异步 build)、del_image、image_platforms、gate |
| file_router | 18 | socket:list/touch/mkdir/copy/move/delete/edit/chmod/chmod_batch/compress/download_from_url(stop)/status；**工作区越界 `../../../../etc` 被拒、`list` 未读 FS**【焦点#5】；实例存在性 gate |
| java_manager_router | 10 | socket:list/add(path.normalize)、download(异步下载+解压)、using(改写 startCommand)、delete、未知 instance 500 |
| schedule_router | 6 | socket:register/list/delete(转发到 InstanceControlSubsystem)、无自有实例 gate(契约测试锁住) |
| http_router | 10 | HTTP(supertest 真 initKoa):/、download/:key/:fileName、upload、upload-new(?stop)、upload-piece |
| upgrade_router | 6 | socket:upgrade/info(onlineNotes 透传)、upgrade/daemon(performUpgrade 调用)、gate |
| instance_event_router | 8 | side-effect relay:InstanceSubsystem data/exit/open/failure → protocol.msg instance/stdout|stopped|opened|failure，多 socket 扇出、500ms 日志刷新(fake timers) |
| harness/smoke | 5 | auth handler/gate |

## 4. TDD 中发现并修复的 bug（3 处，同 pattern）

均为"panel 某些权限/越权门控用 `throw new Error(...)` 或 `ctx.body = new Error(...)`，被 `protocol.middleware` 的 `instanceof Error` 分支覆写为 500，掩盖了预期的 403 Forbidden"。改为字符串 body（`ctx.body = $t(...)`）保留 403，与同文件用字符串 body 的兄弟分支一致，并 TDD 验证（撤销则 500 失败、修复则 403 通过）：

1. `panel/src/app/routers/filemananger_router.ts` — `canFileManager===false` 门控。
2. `panel/src/app/routers/java_manager_router.ts` — 每实例 `router.use` 门控（`CTX_CODE_eb401a37`）。
3. `panel/src/app/routers/mod_manager_router.ts` — `canFileManager===false` 门控。

## 5. 疑虑文档（`docs/test-doubts/`，5 篇，恭喜阅读）

均为"确认是既有设计/协议影响，非本轮确认 bug 或环境限制，未改代码"的条目：

1. `panel-login_router-validator-error-status.md` — `validator()` 中 `return await next()` 被包在 try/catch，handler 在 try 外抛的"非校验类"错误被转成信封 **400**（而非 500/正确语义码）。
2. `panel-protocol-falsey-is-500.md` — `protocol` 把 `false/null/undefined` body 当作 500，`confirm2fa` 的 `ctx.body=false` 退化为 `{500,null}`，业务否与失败无法区分。
3. `panel-settings_router-put_setting.md` — SSO `verifyIssuer` 用运行时 `require("../service/sso_service")` 加载 `.ts`，vitest 0.33 node 环境下原生 `require()` 不被 `vi.mock` 拦截→该直调分支 `it.skip`，前置 https/issuer 校验已覆盖。
4. `panel-mod_manager-canFileManager-403-vs-500.md` — 【**已修复**】记录该 bug 链路（见 §4.3）。
5. `panel-instance_admin-perm-throw-vs-gate-403.md` — `instance_admin GET /` 把每实例归属校验放 handler 体内 `throw`(→500)，与 instance_operate/java_manager 的 403 门控不一致；统一各实例路由越权返回码契约待评估。

## 6. 实现/约束说明

- **真·边界 mock**：panel→daemon 走 `RemoteRequest`（socket.io-client）被桩；user 存储/registry/审计/视觉数据/dockerode/fs/chmod spawn/下载/PTY/`node-schedule` 真定时器均在边界被 mock 或以 tmp 目录沙箱化。**不**启动真实 daemon/docker/PTY/网络/真实端口。
- **真中间件**：panel 的 `permission`/`validator`/`protocol` 与 daemon 的 `routerApp.use` 门控/`protocol.*`/`missionPassport` 均真实运行；只替换 I/O 边界——故鉴权/门控/校验/响应信封都是真实被验证的。
- **既有 E2E harness 不动**：`scripts/verify-auto-update*.mjs`（真实进程 E2E）未触碰。
- **Windows**：`file_router` chmod 全量 mock（无 `/bin/chmod` spawn），跨平台无门控顾虑。
- **既有的自动更新 E2E（auto-update）测试**与本次路由测试分层互补，未冲突。

## 7. 可继续扩展（本次未做，非阻塞）

- **纯函数/中间件级单测**：`panel` 的 `validator`/`speedLimit`/`requestConcurrencyLimiter`/`permission_service`、`daemon` 的 `protocol.*`/`mission_passport` 的纯逻辑可补更细粒度单元测试（当前是经路由集成覆盖）。`common` 已有纯函数测试（`compareVersions`/`StorageSubsystem`/`upgrade`），未改动。
- 路由层覆盖已**全量**（17 panel + 12 daemon），是本次任务的核心目标，已达成。

## 8. 提交脉络（节选，见 `git log feat/backend-route-tests`）

- 设计 spec + 实现计划
- daemon: vitest 脚手架 → router_app 循环依赖抽离 refactor（构建通过）→ harness + smoke → 各 router 测试
- panel: harness + smoke → 各 router 测试（含 auth 族、overview/settings/upgrade、instance 族、files/mod/exchange/daemon、environment/sso、instance_admin）→ 3 处 403 bug 修复
- build(panel,daemon): tsconfig 排除测试（生产构建恢复）
- 本覆盖文档

> 所有测试运行命令见 §1；疑虑索引见 `docs/test-doubts/README.md`。
