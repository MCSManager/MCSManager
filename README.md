![doc_logo.png](/public/common/doc_logo.png)
  
[![Status](https://img.shields.io/badge/npm-v4.16.3-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v8.0-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://travis-ci.org/Suwings/MCSManager.svg?branch=master)](https://travis-ci.org/Suwings/MCSManager)
[![Status](https://img.shields.io/badge/License-AGPLv3-red.svg)](https://github.com/Suwings/MCSManager)


简单，易用，多实例，轻量级的 Minecraft Server 控制面板

**This project does not support English.**

[中文简体](https://github.com/Suwings/MCSManager) | [中文繁體](README-traditional.md)


<br />

快速扩展
-----------
我们用最简单上手的方式，来构建整个应用程序，绝大部分的开发者可以轻而易举的进行修改，以及依照协议开发使用。你会发现，这可能是一非常适合你的 `Minecraft` 服务器管理工具，支持绝大部分的主流服务端。

并且，我们将尽可能的降低扩展的学习成本来帮助你更好的扩展与自定义，让一个完全属于你的`Minecraft`服务器管理器出现。

<br />

运行环境
-----------
- 我们的部署简单至极，在`Master`分支下，我们的设计是下载即可运行，不需要编译与任何配置，除了安装一个环境。

- `Node.js` >= 8.0
- `下载镜像站点`: [https://npm.taobao.org/mirrors/node/v8.0.0/](https://npm.taobao.org/mirrors/node/v8.0.0/)

<br />

运行在 Windows 
-----------

**方法一 (仅限中文简体)**

下载并正确安装 `Node` 环境:

下载源代码并解压: [https://github.com/Suwings/MCSManager/archive/master.zip](https://github.com/Suwings/MCSManager/archive/master.zip)

进入程序源代码目录，并且在当前目录打开命令控制台

执行命令 `npm install --production`

执行命令 `node app.js` 或 `npm start`


**方法二 (包含简体/繁体版本)**

可能因为某些原因，您可能并不愿意安装这些运行环境，于是我们给予了一种绿色打包的运行环境，下载即可直接使用。

下载直接运行:

http://mcsm.suwings.top/ (官方站点 有中文简体/繁体中文版本)


**注意:** 百度网盘提供的下载是打包集成好的，小版本更新我们不会打包，也就是意味着，这里不能实时跟随最新版本。

<br />


运行在 Linux 
-----------
- 相对而言，这可能更加简单。保证您的 node 版本正确与 git 工具可行下，安装与运行易如反掌。

**提示:** 请尽可能的给予 root 权限运行，如无法给予 root 权限，请编辑好文件目录权限，如使用 Docker 等服务不保证能够完全正确运行。

```bash
git clone https://github.com/Suwings/MCSManager.git
cd MCSManager
npm install --production
sudo node app.js #或 sudo npm start
```

> 如果您还是无法运行，请 [单击这里](https://github.com/Suwings/MCSManager/wiki/Linux-%E4%B8%8B%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3)

<br />

使用 Docker 
-----------
**我们支持 Docker 软件** 我们使用 Docker 来进行虚拟化部署，纵使您的机器上没有 Java 任何环境，只需一个 Docker 就能轻松开启 Minecraft 服务器。

另外使用 Docker 也能保证您的宿主机安全性和稳定性，对 Linux 客户而言相信使用起来会更好。

如何使用？打开软件界面，单击 `创建 Docker 镜像`，随后在参数面板设置 `Docker 配置` 即可。

**如需使用 Docker ，请确保您的 Linux 系统拥有 Docker 环境，并且启动服务。**


我们设计得十分简单，但是如果您依然担心您不会操作，可以参考以下相关信息：

具体使用方法: [单击此处跳转](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_1.md)

安装 Docker: [单击此处跳转](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_2.md)
<br />


Wiki
---------
我们有些常见问题与细节上的问题，已经把它们都整合在 `Wiki` 里面。

欢迎你阅读 [Wiki](https://github.com/Suwings/MCSManager/wiki) 与提出建议。

<br />


常见问题
-----------
| 问题 | 详情 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
使用面板开启 `Bedrock Server` 端 | [详情页](https://github.com/Suwings/MCSManager/issues/86)
面板管理员的默认账号和密码是什么？ | [详情页](https://github.com/Suwings/MCSManager/issues/75)
面板如何正确关闭？ | Ctrl+C
配置文件是什么？ | property.js
配好反向代理却无法使用？ | [Apache](https://github.com/Suwings/MCSManager/issues/34) [Nginx](https://github.com/Suwings/MCSManager/issues/22)
FTP 无法使用？ | [跳转](https://github.com/Suwings/MCSManager#ftp-%E6%9C%8D%E5%8A%A1)

<br />

项目目录结构
-----------
**注意:** 并不是所有目录的文件我们都建议你进行更改！

| 目录名 | 详情/解释 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **property.js**                   |控制面板配置文件|
| **core/logo.txt**               |控制台输出 logo 文字|
| **public/**                      |前端所有代码，资源目录，前后端分离，使用 ws 和 ajax 通讯|
| **public/login/**                |纯 UI 逻辑登陆页面|
| **public/template/**             |前端业务模板，每个模板拥有着一个生命周期，开始与结束。|
| **public/onlinefs_public/**      |文件在线管理模块前端所有代码|
| **public/common/js/meum.js**     |控制面板左侧菜单列表|
| **public/common/js/login.js**    |通用登录流程逻辑，可重复利用在各类 HTML 登录模板|
| **server/server_core**           |Minecraft 服务端核心目录，包括服务端文件，配置，Mod，以及插件|
| **server/x.json**               |Minecraft 服务器面板配置文件|
| **users/x.json**                |控制面板用户配置文件|
| **route/**                      |控制器，HTTP 请求业务逻辑层（可二次扩展）|
| **route/websocket/**            |控制器，Webscoket 请求业务逻辑层（可二次扩展）|
| **core/Process/**                |Minecraft Server 类实现|
| **core/User/**                   |User 类实现|
| **core/DataModel.js**            |数据持久化模型，几乎是所有的配置的 I/O 模型|
| **model/**                      |模型层，用于提供控制器与服务端，用户操作，也提供设计模式模型|
| **helper/**                     |业务逻辑辅助层，用于辅助和重复利用业务逻辑|
| **ftpd/**                       |FTP 独立模块，其中 ftpserver.js 已经实现了抽象 ftpServerInterface 接口|
| **onlinefs/**                    |文件管理独立模块 ([Suwings/IndependentFileManager](https://github.com/Suwings/IndependentFileManager))|

<br />

浏览器兼容性
-----------
- `ECMAScript 5` 标准
- `IE 10+` `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器

**例外:** 文件在线管理界面需要 `IE 11+` 

<br />


配置文件
-----------
我们的配置文件是程序目录下的 `property.js` 文件，它会在你第一次运行的时候，自动生成。

> 注意！原旧版本的 McserverConfig.json 文件完全弃用。

> 现在，所有配置将全部归纳于此文件。

> 此文件不会与 github 版本冲突，更新时也不会自动覆盖

<br />


自定义设计
-----------
如果你是内部使用或学习用途，你可以对前端以及后端进行任何修改，包括版权声明。

> 注意！当你进行版本更新的时候，可能会覆盖掉你的自定义修改部分。

> 当然，并不是所有文件都需要覆盖一遍，也不一定非得使用新版本。

<br />

FTP 服务
-----------
FTP 模块采用被动传输模式，传输命令默认使用 `10022`(可更改) 端口；

传输数据需要一个端口段，默认是 `20010` - `20100`；

为确保 FTP 服务正常使用，请配置好您的防火墙设置，对这些端口范围进行开放。

> 当然，我们提供了在线文件管理功能，您大可不必完全使用 FTP。

<br />

反向代理 与 SSL
-----------

尽管默认没有 Https ，您可能在公共网络下不太放心，但是我们不传递明文的密码，可以保证你的账号的密码是难以泄露的。

具体密码传递过程可参考 [单击这里跳转](https://github.com/Suwings/MCSManager/wiki/%E7%99%BB%E5%BD%95%E5%AF%86%E7%A0%81%E4%BC%A0%E9%80%92%E8%BF%87%E7%A8%8B%E5%9B%BE)

**Property 文件**

反向代理之前，你可以但不是必须阅读 `property.js` 文件

> 里面有各类的设置，包括 gzip压缩，端口和ip绑定等等。

**实现 HTTPS 与 WSS**

打开前端 URL 定位文件 `public/common/URL.js`, 将 http 与 ws 改成 https 与 wss；

可保证前端所有请求均为 https 和 wss
> 此文件不会与 github 版本冲突，更新时也不会覆盖，请放心修改。

**反向代理**

后端请通过反向代理完成，或自行修改 Express 初始化 App。

**注意:** [Nginx 反向代理注意](https://github.com/Suwings/MCSManager/issues/22)  | [Apache 反向代理注意](https://github.com/Suwings/MCSManager/issues/34)

<br />

权限系统
-----------
尤其注意的是，为了更加简化面板权限系统，我们只分为两种账号。

`管理账号` 凡是以 # 字符开头的用户，均为管理账号，列如 `#master` `#admin` `#test`

`普通账号` 不以 # 字符开头的用户，列如 `test` `usernameww` `xxx`

普通账号能够管理的服务器只能由管理账号来进行设定，管理账号可以管理任何服务器，并且能管理所有用户。

具体使用，我想你只需要运行就知道，设计的十分简单。

<br />

问题报告
-----------
欢迎各位发现任何 BUG 及时反馈给我，必当及时修复。

<br />

协议与版权
-----------
程序是基于 [GNU Affero General Public License v3.0](./LICENSE "GNU Affero General Public License v3.0")  开放源代码的自由软件。

你可以遵照 AGPLv3 协议来修改和重新发布这一程序。

或者，在学习或私自 (内部) 使用时，在不公开发布的原则下，可以无视这个**协议和版权**，因为这本身并不能束缚你，并且我们欢迎这样做。

<br />
