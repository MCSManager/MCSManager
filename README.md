<img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />

<br />

[![Status](https://img.shields.io/badge/npm-v6.14.15-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v14.17.6-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

[Official Website](http://mcsmanager.com/) | [Panel Project](https://github.com/MCSManager/MCSManager) | [UI Project](https://github.com/MCSManager/UI) | [Daemon Project](https://github.com/MCSManager/Daemon)


[English](readme.md) | [简体中文](README_CN.md) 


<br />

## Introduction

MCSManager Panel（abbr: MCSM Panel）is a multilingual, light-weight, out-of-the-box, and multi-instance Minecraft server control panel with Docker support.

MCSManager control panel can help you manage multiple physical servers at one place, and create game servers at any host dynamically. It also provides a secure and reliable user permission system for a seamless multi-user experience.

![Screenshot.png](https://mcsmanager.com/main.png)
![Screenshot.png](https://mcsmanager.com/main2.png)

<br />

## Runtime Environment

MCSManager control panel can run on both Windows and Linux platforms without database or specific system configuration. As a light-weight control panel, you only need Node.js to run it. 

Required Node.js version: 14.17.0 or above.

<br />

## Configurations/Data Directories

Configuration: `data/SystemConfig/config.json`

User data files: `data/User/*.json`

Remote daemon configurations: `data/RemoteServiceConfig/*.json`


<br />


<br />

## Install

### Windows

For Windows system, the panel was **compiled to a click-to-run version, just download and run.**(administrator permission required):

Go to: [https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**Quick Install with one command**

```bash
wget -qO- https://raw.githubusercontent.com/mcsmanager/Script/master/setup_en.sh | bash
```

- The script is designed for Ubuntu/Centos/Debian/Archlinux of AMD64 architecture only.
- Use `systemctl start mcsm-{web,daemon}` to start service after installtion.
- Directory for panel and runtime: `/opt/mcsmanager/`

<br />

**Linux Manual Installation**

- If the installation script does not work, you can try the following steps to install manually.

```bash
# switch to installation directory. Please create it in advance with 'mkdir /opt/' if not exist.
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

# Download the Web Panel
git clone https://github.com/MCSManager/MCSManager-Web-Production.git
# Rename and enter the directory
mv MCSManager-Web-Production web
cd web
# Install dependencies
npm install --production
cd /opt/mcsmanager/

# Download the Daemon Program
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

# Start the web panel (in the second terminal/screen)
cd /opt/mcsmanager/web
# start the panel
node app.js

# Access http://localhost:23333/ for web panel
# In general, the web panel will scan and connect to the local daemon automatically.
```

- Note, the above steps does not register the panel to system service. You have to use 'screen' to manage it or register system service manually.

<br />

## Update

Upgrading from version `8.X` to `9.X` is not supported. You have to manually import all instance configurations.

Upgrading from version `9.X` to newer:
For Linux: Execute `git pull` in both `/opt/mcsmanager/web` and `/opt/mcsmanager/daemon`.

For Windows: Download the latest installation pack and overwrite all existing files.


> Note, backup of `data` directory before each update is highly recommended.

<br />

## Projects

This software requires all the three projects to run. The code you use for installation is the result of compilation and integration.

[**Control Panel/Web Backend**](https://github.com/MCSManager/MCSManager)

- Role: Control Center
- Responsibie for: Backend APIs, user data management, and communication & authentication with daemons.

[**Web Frontend**](https://github.com/MCSManager/UI)

- Role: The user interface for the backend.
- Responsible for: Displaying statistics via web interface, sending requests, and are capable of communicating with daemons. The final product of this project is pure static files. 

[**Daemon**](https://github.com/MCSManager/Daemon)

- Role: Slave/controlled remote node
- Responsible for: Controlling all instances on local host and managing the actual instance process. It is capablle to communicate with all objects.

<br />

## Build the Development Environment

This is indended for developers. If you are not a developer, you can safely ignore these.

You can continue to develop or prevew all the projects once they are running under the development environment. Please make sure to be in compliance with the license. 

**Control Panel (MCSManager)**

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
npm install
npm run start
# By default, use ts-node to run Typescript code directly
# By default, run on port 23333.

```

**Web Interface (UI)**

```bash
git clone https://github.com/MCSManager/UI.git
cd UI
npm install
npm run serve
# Preview the interface at http://localhost:8080/
# All the requests will be redirected to port 23333.
```

**Daemon**

```bash
git clone https://github.com/MCSManager/Daemon.git
cd Daemon
npm install
npm run start
# After running, please connect the daemon at the control panel.
# By default, run on port 24444
```

<br />

## Browser Compatibility

- Support mainstream modern browsers like `Chrome` `Firefox` `Safari` `Opera`.
- `IE` support has been dropped.

<br />

## i18n

Currently, MCSManager supports Chinese and English.

The MCSManager internationlization was done by [Lazy](https://github.com/LazyCreeper), [KevinLu2000](https://github.com/KevinLu2000), [zijiren233](https://github.com/zijiren233) and [Unitwk](https://github.com/unitwk).

<br />

## Panel Permission

The control panel will check the user list during running. If there is no user available, a default administrator user will be created. 

If you forget your only administrator account, you can backup all the current user data, regenerate a new admin account, and overwrite previous one. 

<br />

## Contribution

If you encounter any issue during your use, you can [submit an Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) or submit Pull Request after you fix it in a fork.

The code needs to be in its existing format, and no extra codes should be formatted. For details: [click here](https://github.com/MCSManager/MCSManager/issues/544)。

<br />

## Report a bug

Feedback on any problems encountered are welcome and will be responded in a timely manner.

If you find a serious security vulnerability, you can email mcsmanager-dev@outlook.com for a private submission.

After the security issue has been resolved, your name will be listed as as the bug finder. 

<br />

## License

Apache-2.0 license

Copyright 2022 [MCSManager Dev](https://github.com/MCSManager).

