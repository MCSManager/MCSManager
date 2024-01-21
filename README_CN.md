<img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />

<br />

[![Status](https://img.shields.io/badge/npm-v6.14.16-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v14.19.1-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

[官方网站](http://mcsmanager.com/) | [使用文档](https://docs.mcsmanager.com/) | [团队主页](https://github.com/MCSManager) | [面板端项目](https://github.com/MCSManager/MCSManager) | [网页前端项目](https://github.com/MCSManager/UI) | [守护进程项目](https://github.com/MCSManager/Daemon)


中文 QQ 群：https://jq.qq.com/?_wv=1027&k=Pgl9ScGw

中文 TG 群：https://t.me/MCSManager_dev

爱发电赞助：https://afdian.net/a/mcsmanager

<br />

## 这是什么？

**MCSManager 面板（简称：MCSM 面板）**

一款开源，分布式，轻量级，快速部署，支持大部分游戏服务端和控制台程序的管理面板。

<br />

## 软件特性

可以帮助您

- 集中管理多个服务器，
- 在任何主机上创建游戏服务端，
- 提供安全可靠的多用户权限系统，
- 很轻松的管理多个节点上的实例，
- 为 Minecraft，Terraria，Steam 等游戏服务器管理员，运维人员和个人开发者提供健康的软件支持。


![截图.png](https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/MCSM9.png)

![Screenshot.png](https://mcsmanager.com/main2.png)

<img width="1322" alt="QQ20221207-174328@2x" src="https://user-images.githubusercontent.com/18360009/206144481-7f57b40d-f71b-4d7e-a617-846da69ca1a3.png">


<br />

## 运行环境

控制面板可运行在 Windows 与 Linux 平台，无需数据库与任何系统配置，只需安装 node 环境即可快速运行。

必须 `Node 14.17.0` 以上，无需数据库和更改任何系统配置，开箱即可运行。

<br />

## 配置/数据文件

配置文件： `mcsmanager/web/data/SystemConfig/config.json`

用户数据文件：`mcsmanager/web/data/User/*.json`

远程守护进程配置：`mcsmanager/web/data/RemoteServiceConfig/*.json`

> 具体以实际安装目录为主。

<br />

## 软件文档

地址：[docs.mcsmanager.com](https://docs.mcsmanager.com/)

<br />

## 快速安装

### Windows

对于 Windows 系统，**已整合成直接运行版本，下载即可运行**:

前往：[mcsmanager.com](https://mcsmanager.com/)

下载后解压档案，以**管理员权限**运行 `start.bat`

> 如果您需要将 MCSManager 面板注册到 Windows 系统服务，请点击[这里](https://github.com/bddjr/mcsmanager-services-for-windows)。

<br />

### Linux

**一行命令快速安装**

```bash
// 国内专用 gitee 加速源
wget -qO- https://gitee.com/mcsmanager/script/raw/master/setup_cn.sh | bash

// 原始源（科学上网）
wget -qO- https://raw.githubusercontent.com/mcsmanager/Script/master/setup.sh | bash
```

- 脚本适用于 x86_64 架构 Ubuntu/Centos/Debian/Archlinux 系统
- 执行完成后，使用 `systemctl start mcsm-{web,daemon}` 即可启动面板服务。
- 面板代码与运行环境自动安装在 `/opt/` 目录下。

<br />

### 手动安装

**Linux**
- 若安装脚本不起作用，则可以尝试以下步骤手动安装。

```bash
# 切换到安装目录。如果不存在，请提前用'mkdir /opt/'创建它。
cd /opt/


# 下载运行时环境（Node.js）。如果你已经安装了Node.js 14+，请忽略此步骤。
wget https://nodejs.org/dist/v14.19.1/node-v14.19.1-linux-x64.tar.gz

# 解压档案
tar -zxvf node-v14.19.1-linux-x64.tar.gz

# 添加系统环境变量
ln -s /opt/node-v14.19.1-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v14.19.1-linux-x64/bin/npm /usr/bin/npm


# 准备好安装目录
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下载MCSManager
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz


# 安装依赖库
./install-dependency.sh


# 请打开两个终端或屏幕
# 启动守护进程
./start-daemon.sh

# 启动面板前端(在第二个终端)
./start-web.sh
```

浏览器访问面板进行初始化 http://localhost:23333/ 或者 http://*youraddress*:23333/

> 一般来说，面板前端会自动扫描并连接到本地守护进程。

- 注意，这种安装方式不会自动注册面板前端和守护进进程到系统服务（systemd），所以一旦关闭终端则程序会被终止。
- 因此请阁下务必使用 `screen` 软件来管理。

<br />

## 更新版本

参考: https://github.com/MCSManager/MCSManager/wiki/Update-MCSManager

> 如果阁下并不是特别需要新版本的功能，或是为了修复安全隐患，那就不建议进行更新。

<br />

## 项目体系

整个软件运行需要三个项目的互相配合才可运行，您普通安装的代码是编译再整合后的产物。

[**控制面板端**](https://github.com/MCSManager/MCSManager)

- 角色：控制中心
- 责任：负责提供网页前端的后端接口，提供 API 接口，用户数据管理和对守护进程进行通信和授权。

[**网页前端**](https://github.com/MCSManager/UI)

- 角色：控制中心的用户交互界面
- 责任：以网页形式展示数据，发送请求，并且拥有与守护进程通信的能力，此项目最终产物是纯静态文件。

[**守护进程**](https://github.com/MCSManager/Daemon)

- 角色：被控端
- 责任：控制本地主机的所有实例，真实进程的实际管理者，拥有与任何对象的通信能力。

<br />

## 搭建开发环境（面向开发人员）

***普通用户无需关注也无需执行。***

所有项目全部以开发环境运行后，便可以进行开发与预览，请务必遵循开源协议。

**控制面板端（MCSManager）**

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
npm install
npm run start
```

- 默认将采用 ts-node 直接执行 Typescript 代码
- 默认运行在 23333 端口

**网页前端（UI）**

```bash
git clone https://github.com/MCSManager/UI.git
cd UI
npm install
npm run serve
```

- 访问 http://localhost:8080/ 即可预览界面
- 所有 API 请求将自动转发到 23333 端口

**守护进程（Daemon）**

```bash
git clone https://github.com/MCSManager/Daemon.git
cd Daemon
npm install
npm run start
```

- 运行后请在控制面板端连接本守护进程
- 默认运行在 24444 端口

<br />

## 浏览器兼容性

- 支持 `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器。
- 已放弃支持 `IE` 浏览器。

<br />

## 国际化

MCSManager 已支持 中文, 英文 两种语言，实现国际化基本全面覆盖。

软件国际化由 [Lazy](https://github.com/LazyCreeper)，[KevinLu2000](https://github.com/KevinLu2000)，[zijiren233](https://github.com/zijiren233) 和 [Unitwk](https://github.com/unitwk) 共同完成

<br />

## 贡献

如果您在使用过程中发现任何问题，可以 [提交 Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) 或自行 Fork 修改后提交 Pull Request。

代码需要保持现有格式，不得格式化多余代码，具体可[参考这里](https://github.com/MCSManager/MCSManager/issues/544)。

<br />

## 问题报告

欢迎报告发现的任何问题进行反馈，必当及时修复。:-)

若发现严重安全漏洞又不便发布，请发送邮件至: mcsmanager-dev@outlook.com。

安全问题修复后将在代码中附加漏洞发现者姓名。

<br />

## 源代码协议

源代码遵循 Apache-2.0 协议。

版权所有 2022 MCSManager 开发团队。

<br />

## 

感谢您对 MCSManager 项目的支持

<br />
