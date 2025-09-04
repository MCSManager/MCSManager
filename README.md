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

[简体中文](README_ZH.md) | [繁體中文](README_TW.md) | [Deutsch](README_DE.md) | [Português BR](README_PTBR.md) |
[日本語](README_JP.md) | [Spanish](README_ES.md) | [Thai](README_TH.md)

</div>

<br />
 
## What is MCSManager?

**MCSManager Panel** (abbreviated as MCSM Panel) is a one-click installation, distributed architecture, multi-user rental, modern web management panel for Minecraft and Steam game servers.

This software has gained considerable popularity within the `Minecraft` and `Steam` gaming communities. It enables centralized management of multiple physical servers, allowing game server creation on any host and providing a secure, reliable multi-user permission system. It simplifies managing multiple servers and has been supporting developers and service providers for steam game servers.

It is also suitable for commercial purposes, such as IDC service providers selling private servers. Several small and medium-sized enterprises are currently using this panel as their sales software.

MCSManager **supports English, German, Japanese, Simplified Chinese, and Traditional Chinese**, with plans to add support for more languages in the future!

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="3502" height="2946" alt="2" src="https://github.com/user-attachments/assets/c1677320-87e3-4b29-ae3b-378544fc36b6" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

**Custom Layout**

![failed_to_load_screenshot.png](/.github/panel-custom-layout.gif)

## Features

1. One-click deployment of `Minecraft` Java/Bedrock Server
2. Compatible with most `Steam` game servers. (e.g. `Palworld`, `Squad`, `Project Zomboid`, `Terraria`, etc.)
3. Customizable UI, create your own layout
4. Supports all images on `Docker Hub`, supports multiple users and supports commercial services!
5. Manage multiple servers with a single web interface
6. The technology stack is simple, and you only need to be good at Typescript to complete the entire MCSManager development.
7. And More!

<br />

## Runtime Environment

MCSM supports both `Windows` and `Linux`. The only requirement is `Node.js` and some libraries **for decompression**.

Requires [Node.js 16.20.2](https://nodejs.org/en) or above.

<br />

## Installation

### Windows

For Windows, we provide packaged executable files:

Go to: [https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**One-Command Deployment**

> The script needs to register system services and requires root permissions because of that.

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**Usage**

```bash
systemctl start mcsm-{web,daemon}
systemctl stop mcsm-{web,daemon}
```

- Only supports Ubuntu/Centos/Debian/Archlinux.
- Installation directory: `/opt/mcsmanager/`.

<br />

**Linux Manual Installation**

- If the installation script fails to execute correctly, you can try to install it manually.

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

## Development

This section is specifically designed for developers. General users may disregard this portion without concern.

### Plugins

We use "VS Code" to develop MCSManager. You may need to install these plugins:

- i18n display support (I18n Ally)
- Code formatter (Prettier)
- Vue - Offcial
- ESLint

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

### Dependency Files

You'll need to go to the [PTY](https://github.com/MCSManager/PTY) and [Zip-Tools](https://github.com/MCSManager/Zip-Tools) projects to download the corresponding binary files and place them in the `daemon/lib` directory to ensure the proper functioning of the `Emulation Terminal` and `File Decompression`.

### Build Production Version

```bash
./build.bat # Windows
./build.sh  # MacOS
```

Output Directory: "production-code"

<br />

## Code Contributing

If you experience any problems while using MCSManager, you are welcome to [submit an Issue](https://github.com/MCSManager/MCSManager/issues/new/choose). Alternatively, you can fork the project and contribute directly by submitting a Pull Request.

Please ensure that any submitted code adheres to our existing coding style. For more details, refer to the guidelines provided in [this issue](https://github.com/MCSManager/MCSManager/issues/544).

<br />

## Browser Compatibility

- Supported on modern browsers including `Chrome`, `Firefox`, and `Safari`.
- Support for `IE` has been discontinued.

<br />

## BUG Reporting

**Open Issue:** [Click here](https://github.com/MCSManager/MCSManager/issues/new/choose)

**Security Vulnerability Report:** [SECURITY.md](SECURITY.md)

<br />

## Internationalization

Thanks to these contributors for providing a substantial amount of translation:

- [KevinLu2000](https://github.com/KevinLu2000)
- [Yumao](https://github.com/yumao233)
- [JHL-HK](https://github.com/jhl-hk)
- [IceBrick](https://github.com/IceBrick01)

<br />

## License

The source code of MCSManager is licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) License.

Copyright ©2025 MCSManager.
