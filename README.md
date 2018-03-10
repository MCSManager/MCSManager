<p><h1><img src="http://39.108.57.206/public/MCSM_LOGO_1.png" />Minecraft Server Manager</h1></p> 

- 简单，易用，简约，轻量级的 Minecraft Server 控制面板

期待你的使用
-----------
![软件截图](http://39.108.57.206/public/MCSM_A.png)
**注意:** 因为不定时更换原因，目前截图不一定最新。

快速扩展
-----------
我们用最简单上手的方式，来构建整个应用程序，绝大部分的开发者可以轻而易举的进行修改，以及依照协议开发使用。你会发现，这可能是一非常适合你的 `Minecraft` 服务器管理工具，支持绝大部分的主流服务端。

并且，我们将尽可能的降低扩展的学习成本来帮助你更好的扩展与自定义，让一个完全属于你的`Minecraft`服务器管理器出现。


环境需求
-----------
- `Node.js` >= 8.0
- `镜像`: [https://npm.taobao.org/mirrors/node/v8.0.0/](https://npm.taobao.org/mirrors/node/v8.0.0/)


运行在 Windows 平台
-----------

**方法一**

下载并正确安装 `Node` 8 环境: [https://npm.taobao.org/mirrors/node/v8.0.0/](https://npm.taobao.org/mirrors/node/v8.0.0/)

下载源代码并解压: [https://github.com/Suwings/MCSManager/archive/master.zip](Master.zip)

确认您的 `JRE` 或 `JDK` 安装并且可以运行

进入程序源代码目录，并且在当前目录打开命令控制台（Shift + 右键）

执行命令 `npm install --production`

执行命令 `node app.js` 或 `npm start`


**方法二**

介于某些原因，您可能并不愿意安装这些运行环境，于是我们给予了一种绿色打包的运行环境，下载即可直接使用

下载直接双击运行: https://pan.baidu.com/s/1bpbB8Az (下载地址)

**注意:** 百度网盘提供的下载是打包集成好的，小版本更新我们不会打包，也就是意味着，这里不能实时跟随最新版本。


运行在 Linux 平台
-----------
- 相对而言，这可能更加简单

```bash
git clone https://github.com/Suwings/MCSManager.git
cd mcsmanager
npm install --production
node app.js #或 npm start
```

项目目录结构
-----------
**注意:** 并不是所有目录的文件我们都建议你进行更改！

| 目录名 | 详情/解释 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **property.js**                   |控制面板内部深度配置|
| **core/logo.txt**               |控制台输出 logo 文字|
| **public/**                      |前端所有代码，资源目录，前后端分离，使用 ws 或 ajax 通讯|
| **public/login/**                |纯 UI 逻辑登陆页面|
| **public/template/**             |前端业务模板，每个模板拥有着一个生命周期，开始与结束。|
| **public/onlinefs_public/**      |文件在线管理模块前端所有代码|
| **public/common/js/meum.js**    |左侧菜单列表|
| **server/server_core**          |Minecraft 服务端核心目录，包括服务端文件，配置，Mod，以及插件|
| **server/x.json**               |Minecraft 服务器面板配置文件|
| **users/x.json**                |控制面板用户配置文件|
| **route/**                      |控制器，HTTP 请求业务逻辑层（可二次扩展）|
| **route/websocket/**            |控制器，Webscoket 请求业务逻辑层（可二次扩展）|
| **core/Process/**                |Minecraft Server 类实现|
| **core/User/**                   |User 类实现|
| **model/**                      |模型层，用于提供控制器与服务端，用户操作，也提供设计模式模型|
| **helper/**                     |业务逻辑辅助层，用于辅助和重复利用业务逻辑|
| **ftpd/**                       |FTP 独立模块，其中 ftpserver.js 已经实现了抽象 ftpServerInterface 接口|
| **onlinefs/**                    |文件管理独立模块 ([Suwings/IndependentFileManager](https://github.com/Suwings/IndependentFileManager))|


浏览器兼容性
-----------
- `ECMAScript 5` 标准
- `IE 10+` `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器

**例外:** 文件在线管理界面需要 `IE 11+` (使用 ECMAScript 6)


问题报告
-----------
欢迎各位发现任何 BUG 及时反馈给我，必当及时修复


开源协议与版权
-----------
程序是基于 [GNU Affero General Public License v3.0](./LICENSE "GNU Affero General Public License v3.0")  开放源代码的自由软件，你可以遵照 AGPLv3 协议来修改和重新发布这一程序。


