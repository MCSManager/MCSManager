# 疑虑：panel `instance_admin_router` 每实例归属校验在 handler 内 throw，非所有者返回错误信封而非 403

## 触发路由
- `GET /api/instance/`（`instance_admin_router.ts`，USER 级，body 内做 `isHaveInstanceByUuid` 校验）。

## 链路分析

`instance_operate_router.ts` / `java_manager_router.ts` / `schedule_router.ts` /
`filemananger_router.ts` / `mod_manager_router.ts` 把"每实例归属校验"放在顶部
`router.use(...)` 中间件里,非所有者时设 `ctx.status = 403; ctx.body = $t(...)` →
**403 Forbidden**。

而 `instance_admin_router.ts` 的 `GET /` 把归属校验写在**路由处理函数体内**(顶层
`router.use` 之外):

```ts
router.get("/", permission({level: ROLE.USER}), validator({query:{daemonId,uuid}}),
  async (ctx) => {
    ... per-instance check inside body -> throw new Error(...) ...
  }
);
```

非所有者时该 throw 会向外冒泡:经 `validator()` 的 `try{ return await next(); }catch{}`
或最终 `protocol.middleware` 的 catch,最终信封为**错误状态(500 错误信封)**,
而非 403。实测(`panel/src/app/routers/instance_admin_router.test.ts` 第 2 个用例)
非所有者返回 **500**(`protocol` 的 Error 分支),与兄弟路由的 403 不一致。

## 实测对照

| 路由 | 每实例校验位置 | 非所有者最终信封 |
| --- | --- | --- |
| `instance_operate` / `java_manager` / `schedule` / `filemananger` / `mod_manager` | 顶部 `router.use` 门控 | **403**(字符串 body) |
| `instance_admin` `GET /` | handler 体内 `throw` | **500**(错误信封) |

## 为何暂未改代码

- 把 `instance_admin` 的体内校验抽到 `router.use` 门控、并统一返回 403,会改变该 API
  的状态码契约,`待评估前端兼容性`(`frontend` 是否按 403/500 分支处理实例越权),
  属于可能破坏性改动。
- 本批次只负责测试覆盖;此处按**当前真实行为(500)**断言通过,并在测试内联注释,
  未改源码。本文档记录该不一致,待后续统一各实例路由的"越权返回码契约"时一并评估。

> 相关:同属"哪个中间件 catch 到 throw 决定 status"的家族问题,参见
> [validator 把 handler 抛错转成 400](panel-login_router-validator-error-status.md) 与
> [protocol 把 falsey 响应体当 500](panel-protocol-falsey-is-500.md)。
