export default {
  common: {
    title: "标题"
  },
  // 模块名或者文件名
  // src\app.ts
  app: {
    developInfo:
      "无法启动，此项目是 MCSManager 开发人员所用项目，普通用户不可直接运行。\n请前往 https://mcsmanager.com/ 了解最新的安装方式。\n如果您要以开发模式运行，请创建 public，src/public 目录并放置前端静态文件再重新运行。",
    panelStarted: "控制面板端已启动",
    reference: "项目参考: https://github.com/mcsmanager",
    host: "访问地址: http://localhost:{{port}}",
    portTip: "软件公网访问需开放端口 {{port}} 与守护进程端口",
    exitTip: "关闭此程序请使用 Ctrl+C 快捷键"
  },
  // src\app\middleware\permission.ts
  permission: {
    forbidden: "权限不足",
    forbiddenTokenError: "令牌(Token)验证失败，拒绝访问",
    xmlhttprequestError: "无法找到请求头 x-requested-with: xmlhttprequest",
    apiError: "密钥不正确"
  },
  // src\app\service\system_remote_service.ts
  systemRemoteService: {
    nodeCount: "远程节点数：{{n}}",
    loadDaemonTitle: "正在尝试读取本地守护进程 {{localKeyFilePath}}",
    autoCheckDaemon: "检测到本地守护进程，正在自动获取密钥和端口...",
    error:
      "无法自动获取本地守护进程配置文件，请前往面板手动连接守护进程，前往 https://docs.mcsmanager.com/ 了解更多。"
  },
  systemUser: {
    userCount: "本地用户数：{{n}}"
  }
};
