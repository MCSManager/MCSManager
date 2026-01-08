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

**MCSManager Panel** (or simply **MCSM Panel**) is a fast-deploying, distributed, multi-user, and modern web-based management panel for **`Minecraft`**, **`Steam`**, and other game servers.

MCSManager has gained popularity within the **`Minecraft`** and **`Steam`** gaming communities. It enables you to manage multiple physical or virtual servers from a single platform, and offers a **secure**, **reliable**, and **granular multi-user permission system**. The MCSM Panel continues to support server administrators, operators, and independent developers, managing servers like **`Minecraft`**, **`Terraria`**, and other **`Steam`**-based games for them.

MCSM also has **commercial applications** in mind, such as private server hosting and sales by **IDC service providers**. Several small and medium-sized enterprises already use the panel as a combined **server management** and **sales platform**. In addition, it supports **multi-language environments**, making it accessible to users across different countries and regions.

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="1915" height="1386" alt="market" src="https://github.com/user-attachments/assets/fc276180-a826-476a-803e-a038f97115fc" />

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<br />

## Features

1. One-click deployment of **`Minecraft`** or **`Steam`** game servers via the built-in application marketplace.
2. Compatible with most **`Steam`**-based game servers, including **`Palworld`**, **`Squad`**, **`Project Zomboid`**, **`Terraria`**, and more.
3. Customizable web interface with drag-and-drop card layout to build your ideal dashboard.
4. Full **Docker Hub** image support, with built-in multi-user access and support for commercial instance hosting services.
5. Distributed architecture, managing multiple machines from a single web panel.
6. Lightweight technology stack. The entire project can be developed and maintained with TypeScript alone.
7. ...and much more.

<br />

## Runtime Environment

The control panel runs on both **`Windows`** and **`Linux`** platforms. No database installation is required. Simply install the **`Node.js`** runtime and a few basic **decompression utilities**.

> Requires **[Node.js 16.20.2](https://nodejs.org/en)** or higher.
> It is recommended to use the **latest LTS version** for best compatibility and stability.

<br />

## Official Documentation

English: https://docs.mcsmanager.com/

Chinese: https://docs.mcsmanager.com/zh_cn/

<br />

## Installation

### Windows

**For Windows systems, it comes as a ready-to-run integrated version - download and run it immediately.**

Archive: https://download.mcsmanager.com/mcsmanager_windows_release.zip

Double-click `start.bat` to launch both the web panel and daemon process.

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

- If the one-click installation method doesn't work, you can install MCSManager manually by following the steps below:

```bash
# Step 1: Navigate to the installation directory (create it if it doesn't exist)
cd /opt/

# Step 2: (Optional) Download and install Node.js if it's not already installed
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
tar -xvf node-v20.11.0-linux-x64.tar.xz

# Add Node.js and npm to the system path
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Step 3: Prepare the MCSManager installation directory
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Step 4: Download the latest MCSManager release
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Step 5: Install dependencies
chmod 775 install.sh
./install.sh

# Step 6: Open two terminal windows or use screen/tmux

# In the first terminal: start the daemon
./start-daemon.sh

# In the second terminal: start the web service
./start-web.sh

# Step 7: Access the panel in your browser
# Replace <public IP> with your server's actual IP address
http://<public IP>:23333/

# The web interface will automatically detect and connect to the local daemon in most cases.
```

> The above steps do **not** register the panel as a system service.  
> To keep it running in the background, you’ll need to use tools like **`screen`** or **`tmux`**.

If you prefer to run MCSManager as a system service, please refer to the official documentation for setup instructions.

<br />

### Mac OS

```bash

# Step 1: Install Node.js (skip if already installed)
# It's recommended to use the latest LTS version
brew install node
node -v
npm -v

# Step 2: Download the latest release using curl
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# Step 3: Extract the downloaded archive
tar -zxf mcsmanager_linux_release.tar.gz

# Step 4: Enter the extracted directory
cd mcsmanager

# Step 5: Make the installer executable and run it
chmod 775 install.sh
./install.sh

# Step 6: Open two terminal windows or use screen/tmux to run services in parallel

# In the first terminal: start the daemon
./start-daemon.sh

# In the second terminal: start the web service
./start-web.sh

# Access the panel at: http://localhost:23333/
# The web interface will typically auto-detect and connect to the local daemon.
```

<br />

### Docker Installation

Install the panel using docker-compose.yml, note that you need to modify all `<CHANGE_ME_TO_INSTALL_PATH>` in it to your actual installation directory.

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

Enable using docker-compose.

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # Write the above docker-compose.yml content here
docker compose pull && docker compose up -d
```

Note: After Docker installation, the Web side may no longer be able to automatically connect to the Daemon.

At this point, if you enter the panel, you should see some errors because the Web side has not successfully connected to the daemon side, you need to create a new node to connect them together.

<br />

## Contributing Code

Before contributing code to this project, please make sure to review the following:

- **Must read:** [Issue #599 – Contribution Guidelines](https://github.com/MCSManager/MCSManager/issues/599)
- Please maintain the existing code structure and formatting, **do not apply unnecessary or excessive formatting changes.**
- All submitted code **must follow internationalization (i18n) standards**.

<br />

## Development

### Project Structure

The project comprises three core modules:

- Daemon backend (`daemon` directory)
- Web backend (`panel` directory)
- Web frontend (`frontend` directory)

**Web Backend Responsibilities:**

- User management
- Node connectivity
- Authentication and authorization
- API services

**Daemon Backend Responsibilities:**

- Process management for server instances
- Docker container operations
- File system management
- Real-time terminal access

**Web Frontend Responsibilities:**

- User interface implementation
- Web backend integration
- Direct node communication for optimized performance

### Setting Up Development Environment

See: [DEVELOPMENT.md](./DEVELOPMENT.md)

<br />

## Browser Compatibility

MCSManager supports all major modern browsers, including:

- `Chrome`
- `Firefox`
- `Safari`
- `Opera`

**Internet Explorer (IE)** is no longer supported.

<br />

## Bug Reports

We welcome all bug reports and feedback. Your contributions help us improve the project.

If you encounter any issues, please report them via the [GitHub Issues](https://github.com/MCSManager/MCSManager/issues) page, and we’ll address them as soon as possible.

For serious **security vulnerabilities** that should not be disclosed publicly, please contact us directly at: **support@mcsmanager.com**

Once resolved, we will credit the discoverer in the relevant code or release notes.

<br />

## Contributors

<a href="https://openomy.com/MCSManager/MCSManager" target="_blank" style="display: block; width: 100%;" align="center">
  <img src="https://openomy.com/svg?repo=MCSManager/MCSManager&chart=bubble&latestMonth=12" target="_blank" alt="Contribution Leaderboard" style="display: block; width: 100%;" />
</a>

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

&copy; 2025 MCSManager. All rights reserved.
