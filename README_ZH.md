<div align="center">
  <a href="https://mcsmanager.com/" target="_blank">
    <img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />    
  </a>

  <br />
  <br />

[![--](https://img.shields.io/badge/Support-Windows/Linux-green.svg)](https://github.com/MCSManager)
[![Status](https://img.shields.io/badge/npm-v8.9.14-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v16.20.2-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

<p align="center">
  <a href="http://mcsmanager.com/"><img alt="Official Website" src="https://img.shields.io/badge/Site-Official Website-green"></a>
  <a href="https://discord.gg/BNpYMVX7Cd"><img alt="Discord" src="https://img.shields.io/badge/Discord-加入我们-5866f4"></a>
  <a href="https://docs.mcsmanager.com/"><img alt="EnglishDocs" src="https://img.shields.io/badge/Docs-English Document-blue"></a>
  <a href="https://docs.mcsmanager.com/zh-cn/"><img alt="Docs" src="https://img.shields.io/badge/Docs-中文文档-blue"></a>
  <a href="https://docs.mcsmanager.com/"><img alt="赞助我们" src="https://img.shields.io/badge/CN-赞助我们-green"></a>
</p>

[English](README.md) - [简体中文](README_ZH.md) - [繁體中文](README_TW.md) - [Deutsch](README_DE.md) - [Português BR](README_PTBR.md) -
[日本語](README_JP.md) - [Spanish](README_ES.md) - [Thai](README_TH.md)

</div>

<br />

## 这是什么？

**MCSManager 面板**（简称：MCSM 面板），是一个快速部署，支持分布式架构，支持多用户，简单易用和现代化的 Minecraft、Steam 和其他游戏服务器 Web 管理面板。

MCSManager 在 `Minecraft` 和 `Steam` 游戏社区内中已有一定的流行程度，它可以帮助你集中管理多个物理服务器，实现在任何主机上创建游戏服务器，并且提供安全可靠的多用户权限系统，可以很轻松的帮助你管理多个服务器，一直在为 `Minecraft`，`Terraria` 和 `Steam` 游戏服务器的管理员，运维人员和个人开发者提供健康的软件支持。

MCSM 同样也考虑了**商业应用**，例如由 **IDC 服务提供商**进行的私有服务器托管和销售。多家中小型企业已经将此面板用作**服务器管理**和**销售平台**的结合。此外，它支持**多语言环境**，使其可供不同国家和地区的用户访问。

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## 功能特性

1. 使用应用市场一键轻松部署 `Minecraft` 或 `Steam` 游戏服务器。
2. 兼容大部分 `Steam` 游戏服务器，列如 `幻兽帕鲁`，`战术小队`，`僵尸毁灭工程` 和 `泰拉瑞亚` 等。
3. 网页支持拖拽式的小卡片布局，打造自己喜欢的界面布局。
4. 支持 `Docker Hub` 上的所有镜像，支持多用户，支持商业化的实例出售服务。
5. 支持分布式，一个网页即可同时管理数台机器。
6. 技术栈简单，仅需擅长 Typescript 即可完成整个 MCSManager 开发！
7. 更多...

<br />

## 运行环境

控制面板可运行在 `Windows` 与 `Linux` 平台，无需安装数据库，只需安装 `Node.js` 环境和几个**用于解压缩**的命令。

必须使用 [Node.js 16.20.2](https://nodejs.org/en) 以上，推荐使用最新版本 LTS 版本。

<br />

## 官方文档

英语：https://docs.mcsmanager.com/

中文：https://docs.mcsmanager.com/zh_cn/

<br />

## 安装

### Windows

对于 Windows 系统，**已整合成直接运行版本，下载即可运行**:

压缩包：https://download.mcsmanager.com/mcsmanager_windows_release.zip

双击 `start.bat` 即可启动面板和守护进程。

<br />

### Linux

**一行命令快速安装**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**安装后的使用方法**

```bash
systemctl start mcsm-{web,daemon} # 开启面板
systemctl stop mcsm-{web,daemon}  # 关闭面板
```

- 脚本仅适用于 Ubuntu/Centos/Debian/Archlinux
- 面板代码与运行环境自动安装在 `/opt/mcsmanager/` 目录下。

<br />

**Linux 手动安装**

- 若一键安装不起作用，则可以尝试此步骤手动安装。

```bash
# 切换到安装目录。如果不存在，请提前用'mkdir /opt/'创建它。
cd /opt/
# 下载运行时环境（Node.js）。如果你已经安装了Node.js 16+，请忽略此步骤。
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# 解压档案
tar -xvf node-v20.11.0-linux-x64.tar.xz
# 添加程序到系统环境变量。
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# 准备好安装目录。
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下载MCSManager。
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# 安装依赖库。
chmod 775 install.sh
./install.sh

# 请打开两个终端或screen。

# 先启动节点程序。
./start-daemon.sh

# 启动网络服务(在第二个终端或screen)。
./start-web.sh

# 访问 http://<公网 IP>:23333/ 查看面板。
# 一般来说，网络应用会自动扫描并连接到本地守护进程。
```

这种安装方式不会自动注册面板到系统服务（Service），所以必须使用 `screen` 软件来管理，如果你希望由系统服务来接管 MCSManager，请参考文档。

<br />

### Mac OS

```bash
# 首先安装 Node.js，如果你已经安装可以忽略这个步骤。
# Node.js 推荐安装最新 LTS 版本。
brew install node
node -v
npm -v

# 使用 curl 下载文件
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# 解压文件（与原命令相同）
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# 安装依赖库。
chmod 775 install.sh
./install.sh

# 请打开两个终端或screen。

# 先启动节点程序。
./start-daemon.sh

# 启动网络服务(在第二个终端或screen)。
./start-web.sh

# 访问 http://localhost:23333/ 查看面板。
# 一般来说，网络应用会自动扫描并连接到本地守护进程。
```

<br />

### 通过 Docker 安装

使用 docker-compose.yml 安装面板，请注意你需要修改里面的所有 `<CHANGE_ME_TO_INSTALL_PATH>` 为你的实际安装目录。

```yml
services:
  web:
    image: githubyumao/mcsmanager-web:latest
    ports:
      - "23333:23333"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - <CHANGE_ME_TO_INSTALL_PATH>/web/data:/opt/mcsmanager/web/data
      - <CHANGE_ME_TO_INSTALL_PATH>/web/logs:/opt/mcsmanager/web/logs

  daemon:
    image: githubyumao/mcsmanager-daemon:latest
    restart: unless-stopped
    ports:
      - "24444:24444"
    environment:
      - MCSM_DOCKER_WORKSPACE_PATH=<CHANGE_ME_TO_INSTALL_PATH>/daemon/data/InstanceData
    volumes:
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
      - <CHANGE_ME_TO_INSTALL_PATH>/daemon/data:/opt/mcsmanager/daemon/data
      - <CHANGE_ME_TO_INSTALL_PATH>/daemon/logs:/opt/mcsmanager/daemon/logs
      - /var/run/docker.sock:/var/run/docker.sock
```

使用 docker-compose 启用。

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # 这里写入上面的docker-compose.yml的内容
docker compose pull && docker compose up -d
```

注意：使用 Docker 安装后，Web 端可能会无法再自动连接到 Daemon。

此时如果你进入面板，应该会出现一些错误，因为面板 Web 端没有成功连接到守护进程端，你需要新建节点让它们联系到一起。

<br />

## 贡献代码

- 贡献代码前必读：https://github.com/MCSManager/MCSManager/issues/599

- 代码需要保持现有格式，不得格式化多余代码。

- 所有代码必须符合国际化标准。

<br />

## 开发此项目

### 项目结构

整体项目总共分为三个部分：

- 网页后端（panel 文件夹）
- 被控节点端（daemon 文件夹）
- 网页前端（frontend 文件夹）

网页后端职责

- 用户管理
- 连接节点
- 大多数操作的权限认证与授权
- API 接口提供
- 更多...

节点端职责

- 真实的进程管理（你的实例进程实际运行处）
- Docker 容器管理
- 文件管理
- 实时终端
- 更多...

网页前端的功能

- 用户 UI 支持
- 与 Web 后端交互
- 部分功能直接与节点端通信，以避免大量流量压力

### 搭建环境

请参阅：[DEVELOPMENT_ZH.md](./DEVELOPMENT_ZH.md)

<br />

## 浏览器兼容性

- 支持 `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器。
- 已放弃支持 `IE` 浏览器。

<br />

## BUG 报告

欢迎发现的任何问题进行反馈，必当及时修复。

若发现严重安全漏洞又不便公开发布，请发送邮件至: support@mcsmanager.com，安全问题修复后将在代码中附加漏洞发现者姓名。

<br />

## 贡献者

<a href="https://openomy.com/MCSManager/MCSManager" target="_blank" style="display: block; width: 100%;" align="center">
  <img src="https://openomy.com/svg?repo=MCSManager/MCSManager&chart=bubble&latestMonth=12" target="_blank" alt="贡献排行榜" style="display: block; width: 100%;" />
</a>

## 许可证

此项目遵循 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) 协议。

Copyright ©2025 MCSManager.
