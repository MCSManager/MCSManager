<img src="https://public-link.oss-cn-shenzhen.aliyuncs.com/mcsm_picture/logo.png" alt="MCSManagerLogo.png" width="510px" />

<br />

[![Status](https://img.shields.io/badge/npm-v6.14.15-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v14.17.6-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-Apache%202.0-red.svg)](https://github.com/MCSManager)

[Official Website](http://mcsmanager.com/) | [Team Homepage](https://github.com/MCSManager) | [Panel Project](https://github.com/MCSManager/MCSManager) | [UI Project](https://github.com/MCSManager/UI) | [Daemon project](https://github.com/MCSManager/Daemon)


[English](readme.md) | [简体中文](README_CN.md) 

<br />



![Screenshot.png](https://mcsmanager.com/main.png)

![Screenshot.png](https://mcsmanager.com/main2.png)

<br />

## Environment

The control panel support Windows and Linux platforms, without database and any system configuration, just install the node environment to run quickly, it is a lightweight Minecraft server control panel.

Must be `Node 14.17.0` or above, it can run out of the box without database and any system configuration changes.

<br />

## Data directory

Configuration file: `data/SystemConfig/config.json`

User data files: `data/User/*.json`

Remote daemon configuration: `data/RemoteServiceConfig/*.json`


<br />

## Install

### Windows

For Windows, Just go to the official website to download and run (run with administrator privileges):

Official Website: [https://mcsmanager.com/](https://mcsmanager.com/)


### linux

**One line command to install quickly**

```bash
wget -qO- https://raw.githubusercontent.com/mcsmanager/Script/master/setup_en.sh | bash
````

- Script only works on AMD64 architecture Ubuntu/Centos/Debian/Archlinux
- After the execution is complete, use `systemctl start mcsm-{web,daemon}` to start the panel service.
- The panel code and runtime environment are automatically installed in the `/opt/mcsmanager/` directory.


**Manual installation**

- If the installation script does not work, you can try this step to install it manually.

```bash
# Switch to the installation directory, if there is no such directory, please execute mkdir /opt/
cd /opt/
# Download the runtime environment (if you have Node 14+, it can be ignored)
wget https://nodejs.org/dist/v14.17.6/node-v14.17.6-linux-x64.tar.gz
# unzip files
tar -zxvf node-v14.17.6-linux-x64.tar.gz
# link the program into the environment variable
ln -s /opt/node-v14.17.6-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v14.17.6-linux-x64/bin/npm /usr/bin/npm

# Prepare the installation directory
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Download the panel (Web) program
git clone https://github.com/MCSManager/MCSManager-Web-Production.git
# rename the folder and enter
mv MCSManager-Web-Production web
cd web
# install dependencies
npm install --production
cd /opt/mcsmanager/

# Download the Daemon program
git clone https://github.com/MCSManager/MCSManager-Daemon-Production.git
# rename the folder and enter
mv MCSManager-Daemon-Production daemon
cd daemon
# install dependencies
npm install --production

# Open two terminals or two terminal windows of Screen software
# Start the daemon first
cd /opt/mcsmanager/daemon
# start up
node app.js

# Then start the panel side process
cd /opt/mcsmanager/web
# start up
node app.js

# Visit http://localhost:23333/ to enter the panel.
# By default, the panel will automatically scan the daemon folder and automatically connect to the daemon.
````

- Note that this installation method does not automatically register the panel to the system service (Service), so it must be managed using the `screen` software.

<br />

## How to update

If you are upgrading from `9.X` to a later version, under `Linux` system, please go to `/opt/mcsmanager/web`, `/opt/mcsmanager/daemon` and execute `git pull` to update .

To update under the `Windows` system, please go to the official website to download the latest installation package and overwrite all files to take effect.

> Note, it is recommended to back up the `data` directory before updating.

<br />

## Projects

The entire software requires the cooperation of the three projects to run. The code you normally install is the product of compilation and integration.

[**Control panel side**](https://github.com/MCSManager/MCSManager)

- Role: Control Center
- Responsibilities: Responsible for providing the back-end interface of the front end of the web page, providing API interfaces, user data management, and communicating and authorizing the daemon.

[**Web Frontend**](https://github.com/MCSManager/UI)

- Role: User interface of the Control Center
- Responsibilities: Display data in the form of web pages, send requests, and have the ability to communicate with daemons. The final product of this project is pure static files.

[**Daemon**](https://github.com/MCSManager/Daemon)

- Role: Controlled
- Responsibility: Controls all instances of localhost, the actual manager of the real process, has the ability to communicate with any object.

<br />

## Build the development environment

This paragraph is intended for developers, normal users do not need to pay attention and do not need to do it.

After all projects are running in the development environment, development and preview can be carried out. Please be sure to follow the open source agreement.

**Control Panel (MCSManager)**

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
npm install
npm run start
# By default, ts-node will be used to directly execute Typescript code
# run on port 23333 by default
````

**Web Frontend (UI)**

```bash
git clone https://github.com/MCSManager/UI.git
cd UI
npm install
npm run serve
# Visit http://localhost:8080/ to preview the interface
# All API requests will be automatically forwarded to port 23333
````

**Daemon**

```bash
git clone https://github.com/MCSManager/Daemon.git
cd Daemon
npm install
npm run start
# After running, please connect the daemon on the control panel side
# run on port 24444 by default
````

<br />

## Browser

- Support modern mainstream browsers such as `Chrome` `Firefox` `Safari` `Opera`.
- `IE` browser support has been dropped.

<br />

## Internationalization

MCSManager has supported English/Chinese, and has achieved full coverage of internationalization.

The MCSManager internationalization is done by [Lazy](https://github.com/LazyCreeper), [zijiren233](https://github.com/zijiren233) and [Unitwk](https://github.com/unitwk)

<br />

## Permissions

The control panel will detect whether the user is empty at runtime, and if it is empty, it will automatically create a default administrator account.

If you forget the administrator account, you can only backup the existing user profile folder and regenerate a new administrator account to overwrite.

<br />

## Contribute

If you find any problems during use, you can [submit an Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) or submit a Pull Request after fork modification.

The code needs to keep the existing format, and no redundant code should be formatted. For details, please refer to [here](https://github.com/MCSManager/MCSManager/issues/544).

<br />

## Bug Report

Feedback on any problems found is welcome and must be fixed in time.

If you find a serious security vulnerability and it is inconvenient to publish it publicly, please send an email to: mcsmanager-dev@outlook.com.

The name of the bug discoverer will be appended to the code after the security issue is fixed.

<br />
