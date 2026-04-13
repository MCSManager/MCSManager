# MCSManager MCP Server

给 AstrBot 使用的 MCSManager MCP stdio server。当前版本聚焦“聊天查状态 + 受控操作服”，默认不开放任意控制台命令。

## 环境变量

- `MCSM_PANEL_BASE_URL`：MCSManager panel API 地址，例如 `http://127.0.0.1:23333/api`。如果只写到 panel 根地址，程序会自动补 `/api`。
- `MCSM_API_KEY`：MCSManager 用户 API Key。请求会通过 `x-request-api-key` 发送。
- `MCSM_CONFIRM_TTL_SECONDS`：启停重启确认码有效期，默认 `60` 秒。
- `MCSM_REQUEST_TIMEOUT_MS`：请求 panel API 超时时间，默认 `5000` 毫秒。
- `MCSM_ALLOWED_INSTANCE_COMMANDS`：允许 MCP 发送的控制台命令名，默认空。示例：`list,tps,say`。

安全建议：

- 第一轮测试可以先只配置 `MCSM_ALLOWED_INSTANCE_COMMANDS=list,tps,say`。
- 不要配置 `op`、`stop`、`restart`、`deop`、`whitelist` 这类高风险命令。
- MCP server 会拒绝未在白名单内的命令、空命令、换行命令和控制字符，避免一次调用注入多条命令。

## 构建

```bash
cd mcsmanager-mcp-server
npm install
npm run build
```

## AstrBot MCP 配置示例

```json
{
  "command": "env",
  "args": [
    "MCSM_PANEL_BASE_URL=http://127.0.0.1:23333/api",
    "MCSM_API_KEY=替换成你的MCSManager API Key",
    "MCSM_CONFIRM_TTL_SECONDS=60",
    "MCSM_ALLOWED_INSTANCE_COMMANDS=list,tps,say",
    "node",
    "/path/to/mcsmanager-mcp-server/dist/index.js"
  ]
}
```

如果 AstrBot 使用 Docker，需要把 `mcsmanager-mcp-server` 放到容器可访问目录，并确认容器内可以执行 `node`。

## 工具

- `mcsm_get_overview`：查看节点和实例总览。
- `mcsm_get_health_report`：生成适合群聊回复的健康报告，包含节点资源、实例 TPS、人数、插件状态和异常摘要。
- `mcsm_get_abnormal_instances`：只列出异常实例，例如节点离线、进程运行但插件离线、TPS 偏低、主线程卡顿、进程 CPU/内存偏高。
- `mcsm_list_nodes`：查看每个节点 CPU、内存、磁盘、在线状态。
- `mcsm_list_instances`：按实例名称、节点名称或状态筛选实例。
- `mcsm_get_instance_status`：查看单个实例完整状态。
- `mcsm_prepare_instance_action`：生成 `start|stop|restart` 确认码，不实际执行。
- `mcsm_confirm_instance_action`：输入确认码后执行已准备好的启停重启操作。
- `mcsm_send_allowed_command`：向指定实例发送白名单控制台命令，例如 `say 服务器将在5分钟后重启`。

确认码只保存在 MCP server 进程内存里，重启 MCP server 后会失效。

## 推荐聊天用法

- “查看当前服务器健康报告”
- “列出异常实例”
- “ce1 当前 TPS 和人数”
- “准备重启 ce1”
- “确认执行 ABCD1234”
- “向 ce1 发送公告：服务器将在 5 分钟后重启”
