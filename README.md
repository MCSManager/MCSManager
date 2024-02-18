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

[Official Website](http://mcsmanager.com/) | [Documentation](https://docs.mcsmanager.com/)

[English](README.md) | [简体中文](README_CN.md)

</div>

<br />

## What is MCSManager?

**MCSManager Panel** (or simply MCSM) is an open-source, distributed, lightweight control panel that can be deployed within minutes and supports most game servers or console programs.

MCSM has already gained a certain level of popularity within the community, specifically Minecraft. It provides one-stop management for instances across multiple servers and provides a secure and reliable multi-user permission system. In addition, MCSM continuously offers support to server administrators of Minecraft, Terraria, and Steam games, aiming to provide a healthy and prosperous community.

![failed_to_load_screenshot.png](https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/MCSM9.png)

<br />

## Features

1. One-click deployment of `Minecraft` Java/Bedrock Server
2. Compatible with most `Steam` game servers. (e.g. `Palworld`, `Squad`, `Project Zomboid`, `Teraria`, etc.)
3. Customizable UI, create your own layout
4. Support `Docker` virtualization, multiuser, and commercial services.
5. Manage multiple servers with a single web interface.
6. More...

<br />

## Runtime Environment

MCSM supports both `Windows` and `Linux`. The only requirement is  `Node.js` and several libraries **used for decompression**.

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
./install-dependency.sh

# Please open two terminals or screens.

# Start the daemon first.
./start-daemon.sh

# Start the web interface at the second terminal or screen.
./start-web.sh

# For web access, go to http://localhost:23333/
# In general, the web interface will automatically scan and add the local daemon. 
```

This installation method does not automatically register the panel as a system service. Therefore, it is necessary to use the screen software for management. If you want to use the system service to manage MCSManager, please refer to the documentation.

<br />

## Browser Compatibility

- Support `Chrome` `Firefox` `Safari` modern browser.
- Support for `IE` has been discontinued.

<br />

## Internationalization (i18n)

MCSManager currently supports English and Simplified Chinese and is capable of supporting more languages in the future.

The translation and software internationalization were completed together by [KevinLu2000](https://github.com/KevinLu2000), [Lazy](https://github.com/LazyCreeper), [zijiren233](https://github.com/zijiren233), and [Unitwk](https://github.com/unitwk). Many thanks for their contributions!

<br />

## Setting Up the Development Environment

This section is intended for developers. General users can safely ignore this section.

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

If you encounter any issues during use, feel free to [submit an Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) or fork them yourself and submit a Pull Request.

Submitted code needs to maintain the same coding style. For more information, please refer to [this issue](https://github.com/MCSManager/MCSManager/issues/544).

<br />

## BUG Reporting

Reporting any bug or issue is welcomed and much appreciated. We will fix any issue promptly and your help will make MCSM better :-D

In case of a severe vulnerability, when it is not appropriate to disclose to the public, please send an email to: mcsmanager-dev@outlook.com. Your name and contribution will be added to the code after the bug is fixed.

<br />

## License

The source code follows the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) License.

Copyright ©2024 MCSManager.
