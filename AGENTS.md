# AGENTS.md

本文件面向接手本仓库的 AI Agent / 自动化编码助手，用于快速理解项目结构、常用命令和高风险位置。更完整的用户文档见 `README*.md`，开发环境说明见 `DEVELOPMENT*.md`。

## 项目概览

这是一个基于 MCSManager 的多模块项目，主要包含：

- `frontend/`：Vue 3 + Vite + Ant Design Vue 前端面板。
- `panel/`：MCSManager Web Panel 后端，负责用户、权限、聚合 Daemon 数据并向前端提供 API。
- `daemon/`：MCSManager Daemon 后端，负责实例进程、文件、终端、Docker、主机指标等节点侧能力。
- `common/`：Panel 和 Daemon 共用的 TypeScript 公共层与全局类型。
- `languages/`：多语言文案资源。
- `mcsm-monitor-plugin/`：Minecraft/Spigot 监控插件，Java 8，目标 Spigot API 1.12.2。
- `mcsmanager-mcp-server/`：MCSManager MCP stdio server，Node.js 18+，用于安全查询和操作实例。

当前仓库远端约定：

- `origin` 指向官方仓库 `MCSManager/MCSManager`，默认不要直接 push。
- `zzrepo` 指向用户仓库 `zz314657917/MCSManager`，当前监控改造分支通常是 `codex/mcsm-monitor-deploy`。
- 发布本项目改动前先确认当前分支和上游，避免把本地实验内容推到官方远端。

监控功能的主要链路：

- Minecraft 侧：`mcsm-monitor-plugin/`
- Daemon 主机/进程指标：`daemon/src/service/monitor_service.ts`、`daemon/src/service/host_metrics.ts`
- Panel 聚合接口：`panel/src/app/routers/monitor_router.ts`
- 前端监控页面：`frontend/src/widgets/MonitorOverview.vue`
- 前端接口封装：`frontend/src/hooks/useMonitorOverview.ts`、`frontend/src/services/apis/index.ts`
- 共享类型：`common/global.d.ts`

已知监控部署约定：

- 监控 v1 不依赖 Prometheus/Grafana，面板通过 `/api/monitor/servers` 聚合当前状态。
- 每台游戏主机运行 MCSManager daemon；面板机运行 panel/frontend，通过远程节点连接 daemon。
- 1.12.2 服务端安装 `mcsm-monitor-plugin`，插件向本机 daemon 的 `/v1/plugin/heartbeat` 上报 TPS、人数和主线程状态。
- Linux 部署脚本在 `prod-scripts/linux/`；`deploy-monitor-daemon-from-repo.sh` 要求目标机已有官方 `/opt/mcsmanager/daemon` 基础安装。
- 服务器上常见约定路径：源码仓库 `/root/MCSManager-monitor`，线上运行目录 `/opt/mcsmanager`。

## 常用命令

Windows PowerShell 下如果 `npm` 被执行策略拦截，使用 `npm.cmd`。

根目录：

```powershell
npm.cmd run install-dependents
npm.cmd run dev
npm.cmd run frontend
npm.cmd run panel
npm.cmd run daemon
```

前端：

```powershell
cd frontend
npm.cmd run type-check
npm.cmd run build-only
npm.cmd run build
```

Panel / Daemon：

```powershell
cd panel
npm.cmd run build

cd ../daemon
npm.cmd run build
```

Common：

```powershell
cd common
npm.cmd run build
```

Minecraft 监控插件：

```powershell
cd mcsm-monitor-plugin
mvn package
```

MCP server：

```powershell
cd mcsmanager-mcp-server
npm.cmd run build
npm.cmd test
```

Linux 生产辅助脚本：

```bash
sudo bash prod-scripts/linux/deploy-monitor-daemon-from-repo.sh
sudo bash prod-scripts/linux/deploy-monitor-web-from-repo.sh
```

注意：`frontend` 的 `npm run lint` 带 `--fix`，会自动改文件。除非任务明确需要，否则不要把它当作只读检查使用。

## 前端要点

- 路由配置在 `frontend/src/config/router.ts`。
- 页面卡片注册和默认布局在 `frontend/src/config/index.ts`。
- 页面容器在 `frontend/src/views/LayoutContainer.vue`。
- 根路由视图在 `frontend/src/App.vue`。当前 `RouterView` 使用 `$route.path` 作为 key，避免仅 query 变化时整页重挂载。
- 实例列表主组件是 `frontend/src/widgets/InstanceList.vue`。
- 实例详情工作区是 `frontend/src/widgets/instance/InstanceWorkspace.vue`。
- 终端核心组件是 `frontend/src/components/TerminalCore.vue`，实例切换时重建终端连接是有意行为，修改前要确认连接清理逻辑。
- 桌面端“应用实例”页是左侧实例列表 + 右侧实例工作台；移动端保留卡片跳转模式。
- `InstanceWorkspace` 外层不要再按实例设置 `key`，否则点击实例会销毁整个右侧工作台并产生明显闪烁。
- 只允许 `TerminalCore` 按 `daemonId:instanceUuid` 重建；终端卸载时必须释放 xterm、事件监听、定时器和 socket。
- 只改 route query 不应触发整页重挂载；如看到列表/工作台整体闪烁，优先检查 `RouterView` key、组件 `key` 和 `v-if` 加载态。

前端验证优先级：

1. 小改动优先跑 `npm.cmd run type-check`。
2. 涉及模板、构建、路由、组件注册时跑 `npm.cmd run build-only`。
3. 修改用户可见页面时，尽量手动打开页面检查交互和布局。

## 后端要点

- `panel/` 和 `daemon/` 都是 Koa + TypeScript + Webpack 构建。
- 修改 API 时同时检查前端调用、共享类型和权限边界。
- 修改 Daemon 实例、文件、终端、Docker、计划任务逻辑时，注意异步任务、资源释放、路径安全和并发问题。
- 修改监控接口时，优先同步 `common/global.d.ts` 中的 `IMcsmMonitor*` 类型，避免前后端字段漂移。

## Minecraft 插件要点

- 插件位于 `mcsm-monitor-plugin/`，Java 8，Spigot API 1.12.2。
- 监控插件已改为自己计算 TPS，不依赖高版本 Paper API；保持 1.12.2 兼容。
- 避免使用高版本 Bukkit/Paper API。
- 不要在异步线程直接调用不安全的 Bukkit API。
- 玩家身份优先使用 UUID，不要依赖玩家名作为唯一标识。
- 修改后优先执行 `mvn package`。

## AstrBot / MCP 要点

- `mcsmanager-mcp-server/` 是独立 Node/TypeScript MCP stdio server，AstrBot 通过 `node dist/index.js` 启动。
- MCP server 只访问 panel API，不直连 A/B/C daemon。
- 环境变量包括 `MCSM_PANEL_BASE_URL`、`MCSM_API_KEY`、`MCSM_CONFIRM_TTL_SECONDS`；API Key 只能放环境变量，不能写入仓库。
- 第一版 MCP 只提供查询、启动、停止、重启等受控操作；不要默认开放任意控制台命令。
- 真实 MCSManager API 返回结构可能是 `{ status, data }` 包装，也可能直接返回数据；改 MCP 解析时要兼容两种形态。

## 国际化和文案

- MCSManager 原项目倾向使用 `languages/*.json` 和 `t(...)` / `$t(...)` 管理文案。
- 新增通用 UI 文案时优先走 i18n，并以 `languages/en_US.json` 作为源文案。
- 监控扩展中已有少量中文直写文案；小范围维护时可以保持局部一致，但面向多语言发布的改动应同步语言文件。

## 修改原则

- 先读相关模块，再改代码；不要做无关重构。
- 不要回滚用户已有改动。
- 不要提交构建产物，除非任务明确要求。
- 不要硬编码密钥、token、私有地址或生产凭据。
- 涉及数据库、认证、权限、生产部署、大规模目录调整时，先说明影响并请求确认。
- Windows 环境下不要混用 PowerShell、cmd、Git Bash 语法。

## 当前易踩点

- PowerShell 可能禁止执行 `npm.ps1`，用 `npm.cmd` 即可。
- `rg` 在某些本地环境可能被拒绝执行，可退回 `git grep` 或 PowerShell `Select-String`。
- `frontend/dist/` 是构建产物，运行 `npm.cmd run build-only` 后通常不应出现需要提交的源代码外改动。
- Ant Design Vue 表格排序应使用原始数值字段，不要对带单位的展示文本排序。
- 只改 query 的前端交互不应导致整页重挂载；如需强制重建页面，先确认是否会触发列表重新请求和动画闪烁。
- 网页直连和“远程节点在线”是两条链路：panel 后端能连 daemon，不代表浏览器能直连 daemon 的 `24444/socket.io`。
- 如果 panel 使用 HTTPS，而 daemon 仍是 `ws://`，浏览器可能拦截混合内容；需要 WSS/HTTPS 反代或正确的远程地址映射。
- 远程节点地址不要随意填 `127.0.0.1`；浏览器侧直连时可能被解析成当前面板域名，导致连错 daemon。
