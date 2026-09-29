# 疑虑：panel `protocol.middleware` 把 `false / null / undefined` 的响应体当作 500

## 触发路由
- `POST /api/auth/confirm2fa`(`general_user_router.ts`) 校验 2FA 失败分支:`ctx.body = false`
- 任何 `ctx.body` 最终赋值为 `false`、`null` 或 `undefined` 的 panel 路由。

## 链路分析

`panel/src/app/middleware/protocol.ts`:

```ts
// When the return result is empty, display processing failed
if (ctx.body === null || ctx.body === false || ctx.body === undefined) {
  ctx.status = 500;
  ctx.body = JSON.stringify({
    status: 500,
    data: ctx.body || null,
    time: new Date().getTime()
  });
  return;
}
```

因此,handler 里像 `confirm2fa` 这样**业务上想用 `false` 表达"未通过/未启用"** 的分支,
最终信封变成 `{status:500, data:null}`——即"处理失败",而非"成功且 data=false"。

## 实测表现(见 `panel/src/app/routers/general_user_router.test.ts`)

| 场景 | handler 设置 | 最终信封 |
| --- | --- | --- |
| `confirm2fa` 校验通过 → 启用 | `ctx.body = true` | `{200, true}` |
| `confirm2fa` 校验**未**通过 → 不启用(`ctx.body = false`) | `ctx.body = false` | **`{500, null}`** |

## 疑虑点

1. **语义混淆**:`false` 既可能是"业务否" 也可能是"失败",二者在当前协议下无法区分——
   一律退化为 `{500, null}`,前端无法据 `data` 区分"鉴权未通过"与"服务器异常"。
2. **影响面广**:任何 handler 返回 `ctx.body = false / null / undefined` 都会变成 500,
   这与业务期望(成功且 data=false/null)相悖(例如 `confirm2fa`、`/auth/update` 中某些分支、
   `logout`/`register` 等返回 `false` 表示"已存在/未操作"的场景)。
3. 前端多按 `result.value === "<字符串>"`(如 `"NEED_2FA"`)或 `result.value` 是否为错误对象做分支,
   对 `false`/`null` 的处理依赖各处具体逻辑,可能把 500 当作"异常"而误报。

## 待后续定夺(暂不改代码)

- 是否应在 `protocol.middleware` 中**只有 `null/undefined`** 才视为"空",而把布尔 `false` 视为正常数据
  (`{200, false}`)?这更符合 REST "data 可为布尔"的语义,但会改变全站返回 `false` 的路由的 status(从 500 → 200),
   属于可能的破坏性改动,需评估前端兼容性。
- 或为 handler 统一约定:业务"否"用诸如 `{status:200, data:false}` 显式对象/或抛出明确错误对象,
   从不直接把 `false`/`null` 作为 `ctx.body`。

测试已按**当前真实行为**(`{500, null}`)断言通过,未改源码。本文档供后续评估。
