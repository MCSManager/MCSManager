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

[Official Website](http://mcsmanager.com/) | [Docs](https://docs.mcsmanager.com/) | [Discord](https://discord.gg/BNpYMVX7Cd)

English | [简体中文](README_ZH.md)

</div>

<br />

## What is MCSManager?

**MCSManager Panel** (MCSM) is a modern, secure, and distributed control panel designed for managing Minecraft and Steam game servers.

MCSM has already gained a certain level of popularity within the community, specifically Minecraft. MCSM excels in offering a centralized management solution for multiple server instances and provides a secure and reliable multi-user permission system. In addition, We are committed to supporting server administrators not only for Minecraft but also for Terraria and various Steam games. Our goal is to foster a thriving and supportive community for game server management.

![failed_to_load_screenshot.png](/.github/panel-image.png)

![failed_to_load_screenshot.png](/.github/panel-instances.png)

<br />

## Features

1. Supports `Minecraft` and `Steam Game Server` (e.g. `Palworld`, `Squad`, `Project Zomboid`, `Teraria`, etc.).
2. Centralized Management for Multiple Machines.
3. Fully Customizable UI!
4. Supports all Docker Images.
5. Require Node.js and No More.
6. Simple Permission System / Multi-User Support!
7. More...

<br />

## Runtime Environment

MCSM supports both `Windows` and `Linux`. The only requirement is `Node.js` and some libraries **for decompression**.

Require [Node.js 16.20.2](https://nodejs.org/en) or above.

<br />

## Installation

### Windows

For Windows systems, **download the binary from MCSM's official website**:

Go to: [https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**One-Command Deployment**

```bash
wget -qO- https://raw.githubusercontent.com/mcsmanager/Script/master/setup.sh | bash
```

- Only supports x86_64 architecture Ubuntu/Centos/Debian/Archlinux.
- After installation, use command `systemctl start mcsm-{web,daemon}` to start MCSM.
- Installation directory: `/opt/mcsmanager/`.

<br />

**Linux Manual Installation**

- If the installation script failed to execute correctly, you can try install it manually.

```bash
# Create /opt directory if not already
mkdir /opt
# Switch to /opt
cd /opt/
# Download Node.js 20.11. If you already have Node.js 16+ installed, ignore this step.
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# Decompress Node.js source
tar -xvf node-v20.11.0-linux-x64.tar.xz
# Add Node.js to system PATH
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Prepare MCSM's installation directory
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Download MCSManager
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Install dependencies
./install.sh

# Please open two terminals or screens.

# Start the daemon first.
./start-daemon.sh

# Start the web interface at the second terminal or screen.
./start-web.sh

# For web access, go to http://localhost:23333/
# In general, the web interface will automatically scan and add the local daemon.
```

This installation approach does not automatically set up MCSManager as a system service. Therefore, it is necessary to use `screen` for management. For those interested in managing MCSManager through a system service, please refer to our wiki/documentation.

<br />

## Browser Compatibility

- Supported on modern browsers including `Chrome`, `Firefox`, and `Safari`.
- Support for `IE` has been discontinued.

<br />

## Internationalization (i18n)

MCSManager is currently available in English and Simplified Chinese, with plans to expand support for additional languages in the future.

The translation and software internationalization were completed together by [KevinLu2000](https://github.com/KevinLu2000), [Lazy](https://github.com/LazyCreeper), [zijiren233](https://github.com/zijiren233), and [Unitwk](https://github.com/unitwk). Many thanks for their contributions!

<br />

## Setting Up the Development Environment

This section is specifically designed for developers. General users may disregard this portion without concern.

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

### Build the Compiled Version

```bash
./build.bat
# Or
./build.sh
```

<br />

## Code Contributing

If you experience any problems while using MCSManager, you are welcome to [submit an Issue](https://github.com/MCSManager/MCSManager/issues/new/choose). Alternatively, you can fork the project and contribute directly by submitting a Pull Request.

Please ensure that any submitted code adheres to our existing coding style. For more details, refer to the guidelines provided in [this issue](https://github.com/MCSManager/MCSManager/issues/544).

<br />

## BUG Reporting

We welcome and greatly appreciate reports of any bugs or issues with MCSManager. Prompt action will be taken to address them, and your assistance plays a crucial role in improving MCSM. :-D

For reporting severe vulnerabilities that should not be publicly disclosed, please email us at : mcsmanager-dev@outlook.com. We will acknowledge your contribution by adding your name to the code after the bug is resolved.

<br />

## License

The source code of MCSManager is licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) License.

Copyright ©2024 MCSManager.
