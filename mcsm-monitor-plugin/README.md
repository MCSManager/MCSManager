# MCSM Monitor Plugin

适用于 `Spigot 1.12.2 / Java 8` 的轻量监控插件。  
它会把 `TPS / 在线人数 / 世界列表 / MOTD / 主线程卡顿状态` 上报到同主机上的 MCSManager Daemon。

## 配置

编辑 `plugins/MCSMMonitor/config.yml`:

```yml
agentUrl: "http://127.0.0.1:24444"
serverId: "你的实例 UUID"
instanceToken: "实例 Token"
heartbeatIntervalTicks: 100
logHeartbeatFailures: true
```

字段说明：

- `agentUrl`: Daemon 地址，通常就是本机 `24444`
- `serverId`: MCSManager 里的实例 UUID
- `instanceToken`: 推荐使用 Daemon 生成的实例 Token
- `logHeartbeatFailures`: 是否输出心跳失败日志；临时不想刷屏可改成 `false`

## 获取实例 Token

如果你知道 Daemon 的 `key`，可以本机请求：

```bash
curl "http://127.0.0.1:24444/v1/plugin/token/<serverId>?apikey=<daemonKey>"
```

返回里的 `instanceToken` 填进插件配置即可。

当前 Daemon 也兼容直接把 `instanceToken` 填成 Daemon 的 `key`，但这只是为了快速接入，长期建议使用实例 Token。

## 重载配置

修改 `plugins/MCSMMonitor/config.yml` 后，可在控制台或游戏内执行：

```text
mcsmmonitor reload
```

游戏内执行需要 `mcsmmonitor.reload` 权限，默认 OP 拥有。

## 构建

```bash
mvn package
```

构建产物：

```text
target/mcsm-monitor-plugin.jar
```
