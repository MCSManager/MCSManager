# SSO / OAuth 2.0 配置指南

MCSManager 支持通过 **OIDC (OpenID Connect)** 或 **通用 OAuth 2.0** 协议接入第三方身份提供商实现单点登录。

## 认证流程

```
用户 → 面板登录页 → 跳转至 IdP 授权 → 用户授权 → 回调至面板 → 绑定/登录
```

- **OIDC 模式**: 自动通过 `/.well-known/openid-configuration` 发现服务端点，使用 `id_token` 中的 `sub` 作为用户标识。
- **OAuth 2.0 模式**: 手动配置三个端点（Authorize / Token / Userinfo），使用 Userinfo 返回的指定字段作为用户标识。

两种模式均使用 PKCE (Proof Key for Code Exchange) 和 `state` 参数确保安全性。

---

## OIDC 配置

适用于支持 OIDC Discovery 的提供商（如 Google、Keycloak、Authentik、Casdoor 等）。

### 配置步骤

1. 在 IdP 中创建 OIDC Client（Application），记录 Client ID 和 Client Secret
2. 在 IdP 中设置 Redirect URI 为：`https://your-panel.com/api/auth/sso/callback`
3. 在面板设置页：
   - 启用 SSO → 是
   - 协议类型 → **OIDC**
   - Issuer 地址 → `https://your-idp.com`（不含 `/.well-known/openid-configuration`）
   - Client ID / Client Secret → 对应填写
   - 回调地址 → 留空自动生成，或手动填写（必须与 IdP 中配置一致）

---

## OAuth 2.0 配置

适用于仅提供标准 OAuth 2.0 接口、不支持 OIDC Discovery 的提供商（如 GitHub）。

### 配置步骤

1. 在提供商中创建 OAuth Application，记录 Client ID 和 Client Secret
2. 在提供商中设置 Callback URL 为：`https://your-panel.com/api/auth/sso/callback`
3. 在面板设置页：
   - 启用 SSO → 是
   - 协议类型 → **OAuth 2.0**
   - Authorize URL → 提供商的授权端点
   - Token URL → 提供商的令牌端点
   - Userinfo URL → 提供商的用户信息端点
   - User ID Field → 用户信息返回中用于唯一标识的字段名
   - Scopes → 请求的权限范围（可选）
   - Client ID / Client Secret → 对应填写

---

## GitHub OAuth 2.0 配置示例

### 1. 创建 GitHub OAuth App

1. 前往 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **New OAuth App**
3. 填写：
   - **Application name**: MCSManager
   - **Homepage URL**: `https://your-panel.com`
   - **Authorization callback URL**: `https://your-panel.com/api/auth/sso/callback`
4. 记录 **Client ID**，点击 **Generate a new client secret** 生成 **Client Secret**

### 2. 面板配置

| 字段 | 值 |
|---|---|
| 协议类型 | OAuth 2.0 |
| Provider Name | GitHub |
| Authorize URL | `https://github.com/login/oauth/authorize` |
| Token URL | `https://github.com/login/oauth/access_token` |
| Userinfo URL | `https://api.github.com/user` |
| User ID Field | `id` |
| Scopes | `read:user` |
| Client ID | 你的 Client ID |
| Client Secret | 你的 Client Secret |

---

## 反向代理配置

使用 Nginx 等反向代理时，必须传递以下请求头以确保回调地址正确：

```nginx
location / {
    proxy_pass http://localhost:23333;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
}
```

如果自动检测不正确，也可以在面板设置中手动填写「回调地址」字段。

---

## 安全注意事项

- **Client Secret** 应妥善保管，切勿泄露
- 建议使用 HTTPS 部署面板
- SSO 仅用于身份认证，用户权限仍由面板管理
- 首次使用 SSO 登录需要将第三方账号绑定到面板账号
- OAuth 2.0 模式下用户标识格式为 `oauth2:{userId}`，与 OIDC 的 `sub` 不会冲突

## 故障排查

| 问题 | 可能原因 |
|---|---|
| 回调到 localhost | 反向代理未传递 `X-Forwarded-Host` / `X-Forwarded-Proto` 头，或未手动设置回调地址 |
| OIDC Discovery 失败 | Issuer 地址不正确或不可达 |
| OAuth 2.0 Token 交换失败 | Token URL 不正确，或 Client Secret 错误 |
| 用户 ID 字段为空 | Userinfo 返回中不包含指定的 User ID Field |
| state 不匹配 | 会话过期（超过 10 分钟），请重试 |
