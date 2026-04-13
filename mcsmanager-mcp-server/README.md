# MCSManager MCP Server

给 AstrBot 使用的 MCSManager MCP stdio server。第一版只做查询和受控启停重启，不开放任意控制台命令。

## 环境变量

- `MCSM_PANEL_BASE_URL`：MCSManager panel API 地址，例如 `http://127.0.0.1:23333/api`。如果只写到 panel 根地址，程序会自动补 `/api`。
- `MCSM_API_KEY`：MCSManager 用户 API Key。请求会通过 `x-request-api-key` 发送。
- `MCSM_CONFIRM_TTL_SECONDS`：操作确认码有效期，默认 `60` 秒。
- `MCSM_REQUEST_TIMEOUT_MS`：请求 panel API 超时时间，默认 `5000` 毫秒。
- `MCSM_ALLOWED_INSTANCE_COMMANDS`：预留配置，v1 不开放控制台命令。

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
    "node",
    "/path/to/mcsmanager-mcp-server/dist/index.js"
  ]
}
```

如果 AstrBot 使用 Docker，需要把 `mcsmanager-mcp-server` 放到容器可访问目录，并确认容器内可以执行 `node`。

## 工具

- `mcsm_get_overview`：查看节点和实例总览。
- `mcsm_list_nodes`：查看每个节点 CPU、内存、磁盘、在线状态。
- `mcsm_list_instances`：按节点或状态筛选实例。
- `mcsm_get_instance_status`：查看单个实例完整状态。
- `mcsm_prepare_instance_action`：生成 `start|stop|restart` 确认码，不实际执行。
- `mcsm_confirm_instance_action`：输入确认码后执行操作。

确认码只保存在 MCP server 进程内存里，重启 MCP server 后会失效。
