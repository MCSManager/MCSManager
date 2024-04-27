<div align="center">
  <a href="https://mcsmanager.com/" target="_blank">
    <img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />    
  </a>

  <br />
  
  <h1 id="mcsmanager">
    <a href="https://mcsmanager.com/" target="_blank">MCSManager Panel</a>
  </h1>

[![--](https://img.shields.io/badge/Support-Windows/Linux-green.svg)](https://github.com/MCSManager)
[![Status](https://img.shields.io/badge/npm-v8.9.14-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v16.20.2-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

[官方网站](http://mcsmanager.com/) | [使用文档](https://docs.mcsmanager.com/#/zh-cn/) | [QQ 群](https://jq.qq.com/?_wv=1027&k=Pgl9ScGw) | [TG 群](https://t.me/MCSManager_dev) | [成为赞助者](https://afdian.net/a/mcsmanager)

[English](README.md) | [简体中文](README_ZH.md) | [繁體中文](README_TW.md)

</div>

<br />

## 这是什么？

**MCSManager 面板**（简称：MCSM 面板）是一款免费，开源，分布式，轻量级，快速部署，支持 Minecraft 和 Steam 游戏服务器的 Web 管理面板。

此软件在 `Minecraft` 和其他游戏社区内中已有一定的流行程度，它可以帮助你集中管理多个物理服务器，实现在任何主机上创建游戏服务器，并且提供安全可靠的多用户权限系统，可以很轻松的帮助你管理多个服务器，一直在为 `Minecraft`，`Terraria` 和 `Steam` 游戏服务器的管理员，运维人员和个人开发者提供健康的软件支持。

![截图加载失败，请科学上网.png](/.github/panel-image.png)

![截图加载失败，请科学上网.png](/.github/panel-instances.png)

<br />

## 功能特性

1. 支持一键开服！轻松部署 `Minecraft` Java 版/基岩版游戏服务器。
2. 兼容大部分 `Steam` 游戏服务器，列如 `幻兽帕鲁`，`战术小队`，`僵尸毁灭工程` 和 `泰拉瑞亚` 等。
3. 网页支持拖拽式的小卡片布局，打造自己喜欢的界面布局。
4. 支持 `Docker` 虚拟化，支持多用户，支持商业出租行为。
5. 支持所有 `Docker` 镜像，轻松打造预设！
6. 支持分布式，一个网页即可同时管理数台机器。
7. 更多...

<br />

## 运行环境

控制面板可运行在 `Windows` 与 `Linux` 平台，无需安装数据库，只需安装 `Node.js` 环境和几个**用于解压缩**的命令。

必须使用 [Node.js 16.20.2](https://nodejs.org/en) 以上，推荐使用最新版本 LTS 版本。

<br />

## 安装

### Windows

对于 Windows 系统，**已整合成直接运行版本，下载即可运行**:

前往：[https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**一行命令快速安装**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup_cn.sh | bash"
```

**安装后的使用方法**

```bash
systemctl start mcsm-{web,daemon} # 开启面板
systemctl stop mcsm-{web,daemon}  # 关闭面板
```

- 脚本仅适用于 Ubuntu/Centos/Debian/Archlinux。
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
# 添加程序到系统环境变量
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# 准备好安装目录
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下载MCSManager
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# 安装依赖库
./install-dependency.sh

# 请打开两个终端或screen

# 先启动节点程序
./start-daemon.sh

# 启动网络服务(在第二个终端或screen)
./start-web.sh

# 为网络界面访问http://localhost:23333/
# 一般来说，网络应用会自动扫描并连接到本地守护进程。
```

这种安装方式不会自动注册面板到系统服务（Service），所以必须使用 `screen` 软件来管理，如果你希望由系统服务来接管 MCSManager，请参考文档。

<br />

## 浏览器兼容性

- 支持 `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器。
- 已放弃支持 `IE` 浏览器。

<br />

## 搭建开发环境

此段落面向开发人员，普通用户无需关注也无需执行。

### MacOS

```bash
git clone https://github.com/MCSManager/MCSManager.git
./install-dependents.sh
./npm-dev-macos.sh
```

### Windows

```bash
git clone https://github.com/MCSManager/MCSManager.git
./install-dependents.bat
./npm-dev-windows.bat
```

### 构建生产环境版本

```bash
./build.bat # Windows
./build.sh  # MacOS
```

接下来你还需要前往 [PTY](https://github.com/MCSManager/PTY) 和 [Zip-Tools](https://github.com/MCSManager/Zip-Tools) 两个项目下载对应的二进制文件，将他们存放到 `daemon/lib` 目录下，以确保 `仿真终端` 和 `文件解压缩` 的正常工作。

<br />

## 贡献代码

如果你在使用过程中发现任何问题，可以 [提交 Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) 或自行 Fork 修改后提交 Pull Request。

代码需要保持现有格式，不得格式化多余代码，具体可[参考这里](https://github.com/MCSManager/MCSManager/issues/544)。

<br />

## BUG 报告

欢迎发现的任何问题进行反馈，必当及时修复。

若发现严重安全漏洞又不便公开发布，请发送邮件至: support@mcsmanager.com，安全问题修复后将在代码中附加漏洞发现者姓名。

<br />

## 国际化

感谢下列成员提供的**大量**翻译文件：

- [KevinLu2000](https://github.com/KevinLu2000)
- [Unitwk](https://github.com/unitwk)
- [JianyueLab](https://github.com/JianyueLab)
- [IceBrick](https://github.com/IceBrick01)

<br />

## 源代码协议

源代码遵循 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) 协议。

Copyright ©2024 MCSManager.
