<img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />

<br />

[![--](https://img.shields.io/badge/Support-Windows/Linux-green.svg)](https://github.com/MCSManager)
[![Status](https://img.shields.io/badge/npm-v6.14.15-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v14.17.6-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

[Official Website](http://mcsmanager.com/) | [Web Project](https://github.com/MCSManager/MCSManager) | [UI Project](https://github.com/MCSManager/UI) | [Daemon Project](https://github.com/MCSManager/Daemon)


[English](readme.md) | [简体中文](README_CN.md) 


<br />

## Introduction

MCSManager Panel（abbr: MCSM Panel）is a multilingual, lightweight, out-of-the-box, and multi-instance Minecraft server control panel with Docker support.

MCSManager panel can help you manage multiple physical servers in one place, and create game servers at any host dynamically. It also provides a secure and reliable user permission system for a seamless multi-user experience.

![Screenshot.png](https://mcsmanager.com/main.png)
![Screenshot.png](https://mcsmanager.com/main2.png)

<br />

## Runtime Environment

MCSManager panel can run on both Windows and Linux platforms without a database or complicated system configuration. As a lightweight control panel, you only need Node.js to run it. 

Required Node.js version: **14.17.6** or above.

<br />

## Install

### Windows

For the Windows systems, the MCSM panel has been **compiled into a click-to-run version**. 

Download it from the official site: [https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**Quick Install with one command**

```bash
wget -qO- https://raw.githubusercontent.com/mcsmanager/Script/master/setup_en.sh | bash
```

- The script is designed for Ubuntu/Centos/Debian/Archlinux of AMD64 architecture only.
- Use `systemctl start mcsm-{web,daemon}` to start service after installtion.
- Directory for panel components and runtime: `/opt/mcsmanager/`

<br />

**Linux Manual Installation**

- If the installation script does not work, you can try the following steps to install manually.

```bash
# switch to the installation directory. Please create it in advance with 'mkdir /opt/' if not exist.
cd /opt/
# Download runtime environment (Node.js). Ignore this step if you have Node.js 14+ installed already.
wget https://nodejs.org/dist/v14.17.6/node-v14.17.6-linux-x64.tar.gz
# Decompress archive
tar -zxvf node-v14.17.6-linux-x64.tar.gz
# Add program to system PATH
ln -s /opt/node-v14.17.6-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v14.17.6-linux-x64/bin/npm /usr/bin/npm

# Prepare installation directory
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Download the web project
git clone https://github.com/MCSManager/MCSManager-Web-Production.git
# Rename and enter the directory
mv MCSManager-Web-Production web
cd web
# Install dependencies
npm install --production
cd /opt/mcsmanager/

# Download the Daemon
git clone https://github.com/MCSManager/MCSManager-Daemon-Production.git
# Rename and enter the directory
mv MCSManager-Daemon-Production daemon
cd daemon
# Install dependencies
npm install --production

# Please open two terminals or Screen
# Start the daemon first
cd /opt/mcsmanager/daemon
# Start the daemon
node app.js

# Start the web project (in the second terminal/screen)
cd /opt/mcsmanager/web
# start the application
node app.js

# Access http://localhost:23333/ for web interface
# In general, the web application will scan and connect to the local daemon automatically.
```

- Note, the above steps do not register the panel components to system service. You have to use 'screen' to manage it or register the system service manually.

<br />


## Data Directories

Web Config & Data: `/opt/mcsmanager/web/data/`

Daemon Config & Data `/opt/mcsmanager/daemon/data/`

<br />


## Update

Reference: https://github.com/MCSManager/MCSManager/wiki/Update-MCSManager

> Note, backup of `data` directory before each update is highly recommended.

<br />

## Projects

This software requires all three projects to run. The code you use for installation is the result of compilation and integration.

[**Web Backend**](https://github.com/MCSManager/MCSManager)

- Role: Control Center
- Responsible for: Backend APIs, user data management, and communication & authentication with daemons.

[**Frontend/UI**](https://github.com/MCSManager/UI)

- Role: The user interfaces for the backend.
- Responsible for: Displaying statistics via the web interface, sending requests, and communicating with daemons. The final product of this project is pure static files. 

[**Daemon**](https://github.com/MCSManager/Daemon)

- Role: Slave/controlled remote node
- Responsible for: Controlling all instances on localhost and managing the actual instance process. It is capable to communicate with all objects.

<br />

## Build the Development Environment

This is intended for developers. If you are not a developer, you can safely ignore these.

You can continue to develop or preview all the projects once they are running under the development environment. Please make sure to be in compliance with the license. 

**Web Project**

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
npm install
npm run start
# By default, use ts-node to run Typescript code directly
# By default, run on port 23333.

```

**UI Project**

```bash
git clone https://github.com/MCSManager/UI.git
cd UI
npm install
npm run serve
# Preview the interface at http://localhost:8080/
# All the requests will be redirected to port 23333.
```

**Daemon Project**

```bash
git clone https://github.com/MCSManager/Daemon.git
cd Daemon
npm install
npm run start
# After running, please connect the daemon to the control panel via the web interface.
# By default, run on port 24444
```

<br />

## Browser Compatibility

- Support mainstream modern browsers like `Chrome` `Firefox` `Safari` `Opera`.
- `IE` support has been dropped.

<br />

## i18n

The MCSManager internationlization was done by [Lazy](https://github.com/LazyCreeper), [KevinLu2000](https://github.com/KevinLu2000), [zijiren233](https://github.com/zijiren233) and [Unitwk](https://github.com/unitwk).

<br />

## Panel Permission

The control panel will check the user list while running. If there is no user available, a default administrator user will be created. 

If you forget your only administrator account, you can back up all the current user data, regenerate a new admin account, and overwrite the previous one. 

> User Data: /opt/mcsmanager/web/data/Users/*.json

<br />

## Contribution

If you encounter any issue while using, you can [submit an Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) or submit Pull Request after you fix it in a fork.

The code needs to be in its existing format, and no extra codes should be formatted. For details: [click here](https://github.com/MCSManager/MCSManager/issues/544)。

<br />

## Report bug

Feedback on any problem encountered is welcomed and will be responded to in a timely manner.

If you find a serious security vulnerability, you can email mcsmanager-dev@outlook.com for a private submission.

After the security issue has been resolved, your name will be listed as the bug-finder. 

<br />

## License

Copyright 2022 [MCSManager Dev](https://github.com/mcsmanager), Apache-2.0 license.

**Additional Requirements:**

You must keep all copyright information and place "Powered by MCSManager" in a conspicuous position.



