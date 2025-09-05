<div align="center">
  <a href="https://mcsmanager.com/" target="_blank">
    <img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />    
  </a>

  <br />
  <br />

[![--](https://img.shields.io/badge/Support%20Platform-Windows/Linux/Mac-green.svg)](https://github.com/MCSManager)
[![Status](https://img.shields.io/badge/NPM-v8.9.14-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/Node-v16.20.2-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

<p align="center">
  <a href="http://mcsmanager.com/"><img alt="Official Website" src="https://img.shields.io/badge/Site-Official Website-yellow"></a>
  <a href="https://docs.mcsmanager.com/"><img alt="EnglishDocs" src="https://img.shields.io/badge/Docs-English Document-blue"></a>
  <a href="https://discord.gg/BNpYMVX7Cd"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join Us-5866f4"></a>
  
</p>

<br />

[English](README.md) - [简体中文](README_ZH.md) - [繁體中文](README_TW.md) - [日本語](README_JP.md) - [Deutsch](README_DE.md) - [Русский](README_RU.md) - [Spanish](README_ES.md) - [Thai](README_TH.md) - [Français](README_FR.md) - [Português BR](README_PTBR.md)

</div>

<br />

## What is this?

**MCSManager Panel** (abbreviated as: MCSM Panel) is a fast-deploying, distributed architecture-supported, multi-user, simple and modern web management panel for Minecraft and Steam game servers.


MCSManager has gained popularity within the `Minecraft` and `Steam` gaming communities. It helps you centrally manage multiple physical servers, enabling you to create game servers on any host, and provides a secure and reliable multi-user permission system that can easily help you manage multiple servers. It has been providing healthy software support for administrators, operations personnel, and individual developers of `Minecraft`, `Terraria`, and `Steam` game servers.


It is also suitable for any commercial activities, such as IDC service providers for private server sales, etc. Several small and medium-sized enterprises are already using this panel as management & sales software, and it supports **multiple countries'** languages.

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## Features

1. Use the application market to easily deploy `Minecraft` or `Steam` game servers with one click.
2. Compatible with most `Steam` game servers, such as `Palworld`, `Squad`, `Project Zomboid`, and `Terraria`, etc.
3. Web interface supports drag-and-drop card layout to create your preferred interface layout.
4. Supports all images on `Docker Hub`, supports multi-user, supports commercial instance sales services.
5. Supports distributed architecture, one web interface can manage multiple machines simultaneously.
6. Simple technology stack, only need to be proficient in TypeScript to complete the entire MCSManager development!
7. More...

<br />

## Runtime Environment

The control panel can run on `Windows` and `Linux` platforms, no database installation required, only need to install `Node.js` environment and several **commands for decompression**.

Must use [Node.js 16.20.2](https://nodejs.org/en) or above, recommend using the latest LTS version.

<br />

## Installation

### Windows

Download: https://download.mcsmanager.com/mcsmanager_windows_release.zip

Start panel:

```bash
start.bat
```

<br />

### Linux

**One-line command quick installation**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**Usage after installation**

```bash
systemctl start mcsm-{web,daemon} # Start panel
systemctl stop mcsm-{web,daemon}  # Stop panel
```

- Script only applies to Ubuntu/Centos/Debian/Archlinux
- Panel code and runtime environment are automatically installed in the `/opt/mcsmanager/` directory.

<br />

**Linux Manual Installation**

- If one-click installation doesn't work, you can try this step for manual installation.

```bash
# Switch to installation directory. If it doesn't exist, please create it with 'mkdir /opt/' first.
cd /opt/
# Download runtime environment (Node.js). If you already have Node.js 16+ installed, please ignore this step.
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# Extract archive
tar -xvf node-v20.11.0-linux-x64.tar.xz
# Add program to system environment variables.
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Prepare installation directory.
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Download MCSManager.
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Install dependencies.
chmod 775 install.sh
./install.sh

# Please open two terminals or screen.

# Start node program first.
./start-daemon.sh

# Start web service (in second terminal or screen).
./start-web.sh

# Visit http://<public IP>:23333/ to view the panel.
# Generally, the web application will automatically scan and connect to the local daemon.
```

This installation method does not automatically register the panel to system services, so you must use `screen` software to manage it. If you want the system service to take over MCSManager, please refer to the documentation.

### Mac OS

```bash

# First install Node.js, if you already have it installed, you can skip this step.
# Node.js recommends installing the latest LTS version.
brew install node
node -v
npm -v

# Use curl to download files
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# Extract files (same as original command)
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# Install dependencies.
chmod 775 install.sh
./install.sh

# Please open two terminals or screen.

# Start node program first.
./start-daemon.sh

# Start web service (in second terminal or screen).
./start-web.sh

# Visit http://localhost:23333/ to view the panel.
# Generally, the web application will automatically scan and connect to the local daemon.
```

<br />

## Contributing Code

- Must read before contributing code: https://github.com/MCSManager/MCSManager/issues/599

- Code needs to maintain existing format, no excessive code formatting allowed.

- All code must comply with internationalization standards.

<br />

## Development

This section is for developers. If you want to do secondary development on MCSManager or submit code contributions, please carefully read these contents:

### Required

We use `Visual Studio Code` to develop MCSManager. You **must install** these plugins:

- i18n text display support (I18n Ally)
- Code formatting (Prettier)
- Vue - Official
- ESLint

### Dependency Files

You need to go to [PTY](https://github.com/MCSManager/PTY) and [Zip-Tools](https://github.com/MCSManager/Zip-Tools) projects to download binary files suitable for your system, store them in the `daemon/lib` directory (create manually if it doesn't exist) to ensure normal operation of `simulation terminal` and `file decompression`.

### Running

```bash
git clone https://github.com/MCSManager/MCSManager.git

# MacOS
./install-dependents.sh
./npm-dev-macos.sh

# Windows
./install-dependents.bat
./npm-dev-windows.bat
```

### Code Internationalization

Since the project adapts to multiple languages, all `strings` and `comments` in the code only accept English, so please do not hardcode non-English text directly in the code.

For example, you might write a new string that needs to adapt to multiple languages.

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Check Name Failed!" // Don't do this!
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // Correct!
}.
```

```html
<script lang="ts" setup>
  import { t } from "@/lang/i18n";
  // ...
</script>

<template>
  <!-- ... -->
  <a-menu-item key="toNodesPage" @click="toNodesPage()">
    <FormOutlined />
    {{ t("TXT_CODE_NODE_INFO") }}
  </a-menu-item>
</template>
```

Please add this line to the language file, for example: `languages/en_US.json`

Among them, `en_US.json` is mandatory to add, it is the source text for all country languages, other country languages can be automatically translated by us using AI.

```json
{
  //...
  "TXT_CODE_MY_ERROR": "Check Name Failed!",
  "TXT_CODE_NODE_INFO": "Jump to Node Page"
}
```

If you have installed the `I18n Ally` plugin, your `$t("TXT_CODE_MY_ERROR")` should display the English text.

If the translation text needs to carry parameters, this might be a bit complex, because the frontend and backend use different i18n libraries, so the format might be different. You need to look through the files to find similar code to understand.

All translation text keys cannot be duplicated, so please try to use a longer name!

### Building Production Environment Version

```bash
./build.bat # Windows
./build.sh  # MacOS
```

After building is complete, you will find the production environment code in the `production-code` directory.

<br />

## Browser Compatibility

- Supports modern mainstream browsers like `Chrome` `Firefox` `Safari` `Opera`.
- Has abandoned support for `IE` browser.

<br />

## Bug Reports

Welcome to report any issues found, we will fix them promptly.

If you discover serious security vulnerabilities that are inconvenient to publish publicly, please send an email to: support@mcsmanager.com. After security issues are fixed, the discoverer's name will be attached in the code.

<br />

## License

Source code follows [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) license.

Copyright ©2025 MCSManager.
