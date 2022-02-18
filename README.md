<img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManager 图标.png" width="500px" />

<br />

[![Status](https://img.shields.io/badge/npm-v6.14.15-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v14.17.6-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-AGPL-red.svg)](https://github.com/Suwings/MCSManager)

[官方网站](http://mcsmanager.com/) | [使用文档](https://docs.mcsmanager.com/) | [团队主页](https://github.com/MCSManager) | [面板端项目](https://github.com/MCSManager/MCSManager) | [网页前端项目](https://github.com/MCSManager/UI) | [守护进程项目](https://github.com/MCSManager/Daemon)

<br />

## 软件简介

**分布式，稳定可靠，开箱即用，高扩展性，支持 Minecraft 和其他少数游戏的控制面板。**

MCSManager 面板（简称：MCSM 面板）是一款全中文，轻量级，开箱即用，多实例和支持 Docker 的 Minecraft 服务端管理面板。

此软件在 Minecraft 和其他游戏社区内中已有一定的流行程度，它可以帮助你集中管理多个物理服务器，动态在任何主机上创建游戏服务端，并且提供安全可靠的多用户权限系统，可以很轻松的帮助你管理多个服务器。

![截图.png](https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/MCSM9.png)

<br />

## 运行环境

控制面板可运行在 Windows 与 Linux 平台，无需数据库与任何系统配置，只需安装 node 环境即可快速运行，属于轻量级的 Minecraft 服务端控制面板。

必须 `Node 14.17.0` 以上，无需数据库和更改任何系统配置，开箱即可运行。

<br />

## 配置/数据文件

配置文件： `data/SystemConfig/config.json`

用户数据文件：`data/User/*.json`

远程守护进程配置：`data/RemoteServiceConfig/*.json`

面板默认访问账号：`root` `123456`

<br />

## 软件使用文档

地址：[https://docs.mcsmanager.com/](https://docs.mcsmanager.com/)

> 文档正在不断完善，里面的内容还有瑕疵，暂且仅供参考。

> 旧版 `8.X` 文档与 API 备份在[此处](https://github.com/MCSManager/Backup-v8.7/wiki/API-Documentation)。

<br />

## 在 Windows 运行

对于 Windows 系统，**已整合成直接运行版本，下载即可运行**（使用管理员权限运行）:

前往：[https://mcsmanager.com/](https://mcsmanager.com/)

<br />

## 在 Linux 运行

**一行命令快速安装**

```bash
wget -qO- https://gitee.com/mcsmanager/script/raw/master/setup.sh | bash
```

- 脚本仅适用于 AMD64 架构 Ubuntu/Centos/Debian/Archlinux）
- 执行完成后，使用 `systemctl start mcsm-{web,daemon}` 即可启动面板服务。
- 面板代码与运行环境自动安装在 `/opt/mcsmanager/` 目录下。

<br />

**Linux 手动安装**

- 若一键安装不起作用，则可以尝试此步骤手动安装。

```bash
# 切换到安装目录，没有此目录请执行 mkdir /opt/
cd /opt/
# 下载运行环境（已有 Node 14+ 可忽略）
wget https://npm.taobao.org/mirrors/node/v14.17.6/node-v14.17.6-linux-x64.tar.gz
# 解压文件
tar -zxvf node-v14.17.6-linux-x64.tar.gz
# 链接程序到环境变量中
ln -s /opt/node-v14.17.6-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v14.17.6-linux-x64/bin/npm /usr/bin/npm

# 准备安装目录
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下载面板端（Web）程序
git clone https://github.com/MCSManager/MCSManager-Web-Production.git
# 重命名文件夹并进入
mv MCSManager-Web-Production web
cd web
# 安装依赖库
npm install --registry=https://registry.npm.taobao.org

# 下载守护进程（Daemon）程序
git clone https://github.com/MCSManager/MCSManager-Daemon-Production.git
# 重命名文件夹并进入
mv MCSManager-Daemon-Production daemon
cd daemon
# 安装依赖库
npm install --registry=https://registry.npm.taobao.org


# 打开两个终端或两个 Screen 软件的终端窗口
# 先启动守护进程
cd /opt/mcsmanager/daemon
# 启动
node app.js

# 然后启动面板端进程
cd /opt/mcsmanager/web
# 启动
node app.js

# 访问 http://localhost:23333/ 即可进入面板。
# 默认情况下，面板端会自动扫描 daemon 文件夹并且自动连接到守护进程。
```

- 注意，这种安装方式不会自动注册面板到系统服务（Service），所以必须使用 `screen` 软件来管理。

<br />

## 更新版本

如果您想从 `8.X` 版本更新到 `9.X` 版本，这是不支持的，只能手动一个个导入实例配置和文件。

如果您是 `9.X` 升级到更高版本，在 `Linux` 系统下，请分别前往 `/opt/mcsmanager/web`，`/opt/mcsmanager/daemon` 目录中执行 `git pull` 进行更新。

在 `Windows` 系统下更新请前往官方下载最新安装包，覆盖所有文件即可生效。

> 注意，建议更新前备份一次 `data` 目录。

<br />


## 项目体系

整个软件运行需要三个项目的互相配合才可运行，您普通安装的代码是编译再整合后的产物。

[**控制面板端**](https://github.com/MCSManager/MCSManager)

- 角色：控制中心
- 责任：负责提供网页前端的后端接口，提供API接口，用户数据管理和对守护进程进行通信和授权。
 
[**网页前端**](https://github.com/MCSManager/UI)

- 角色：控制中心的用户交互界面
- 责任：以网页形式展示数据，发送请求，并且拥有与守护进程通信的能力，此项目最终产物是纯静态文件。
 
[**守护进程**](https://github.com/MCSManager/Daemon)

- 角色：被控端
- 责任：控制本地主机的所有实例，真实进程的实际管理者，拥有与任何对象的通信能力。

<br />

## 搭建开发环境

此段落面向开发人员，普通用户无需关注也无需执行。

所有项目全部以开发环境运行后，便可以进行开发与预览，请务必遵循开源协议。

**控制面板端（MCSManager）**

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
npm install
npm run start 
# 默认将采用 ts-node 直接执行 Typescript 代码
# 默认运行在 23333 端口
```

**网页前端（UI）**

```bash
git clone https://github.com/MCSManager/UI.git
cd UI
npm install
npm run serve
# 访问 http://localhost:8080/ 即可预览界面
# 所有 API 请求将自动转发到 23333 端口
```

**守护进程（Daemon）**

```bash
https://github.com/MCSManager/Daemon.git
cd Daemon
npm install
npm run start
# 运行后请在控制面板端连接本守护进程
# 默认运行在 24444 端口
```


<br />

## 浏览器兼容性

- 支持 `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器。
- 已放弃支持 `IE` 浏览器。

<br />

## 面板权限

控制面板在运行时会检测用户是否为空，若为空会自动创建一个默认的管理员账号。

如果您忘记了管理员账号，您只能备份现有的用户配置文件夹，并且重新生成一个新的管理员账号以覆盖。

<br />

## 贡献

如果你在使用过程中发现任何问题，可以 [提交 Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) 或自行 Fork 修改后提交 Pull Request。

代码需要保持现有格式，不得格式化多余代码，具体可[参考这里](https://github.com/MCSManager/MCSManager/issues/544)。

<br />

## 问题报告

欢迎发现的任何问题进行反馈，必当及时修复。

若发现严重安全漏洞又不便公开发布，请发送邮件至: Suwings@outlook.com，安全问题修复后将在代码中附加漏洞发现者姓名。

<br />

## 版权约束

此开源项目使用 [AGPL 协议](LICENSE) 作为开源协议，未经过官方闭源开发授权，您如果对代码有任何修改，则必须要公开您修改后的源代码，具体约束如下。

**准许**

- 对软件源代码进行修改，复制，分发。
- 利用软件进行商业使用，赚取利润。

**必须**

- 公开提供您修改后的完整源代码。
- 在代码文件、界面中保留版权声明。

**禁止**

- 禁止售卖此软件，申请专利，著作权等。

> 更多授权与版权约束详情，请前往官方网站界面了解更多。

<br />
