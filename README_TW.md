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

[English](README.md) - [简体中文](README_ZH.md) - [繁體中文](README_TW.md) - [Deutsch](README_DE.md) - [Português BR](README_PTBR.md) -
[日本語](README_JP.md) - [Spanish](README_ES.md) - [Thai](README_TH.md)

</div>

<br />

## 這是什麼？

**MCSManager Panel**（簡稱：MCSM Panel）是一個快速部署、支援分散式架構、多使用者、簡單現代的 Minecraft 和 Steam 遊戲伺服器網頁管理面板。

MCSManager 在 `Minecraft` 和 `Steam` 遊戲社群中廣受歡迎。它幫助您集中管理多台實體伺服器，讓您可以在任何主機上建立遊戲伺服器，並提供安全可靠的多使用者權限系統，可以輕鬆幫助您管理多個伺服器。它一直為 `Minecraft`、`Terraria` 和 `Steam` 遊戲伺服器的管理員、營運人員和個人開發者提供健康的軟體支援。

它也適用於任何商業活動，例如 IDC 服務提供商的私人伺服器銷售等。幾家中小企業已經將此面板用作管理和銷售軟體，並支援**多個國家**的語言。

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## 功能特色

1. 使用應用程式市場輕鬆一鍵部署 `Minecraft` 或 `Steam` 遊戲伺服器。
2. 相容於大多數 `Steam` 遊戲伺服器，如 `Palworld`、`Squad`、`Project Zomboid` 和 `Terraria` 等。
3. 網頁介面支援拖放卡片佈局，建立您偏好的介面佈局。
4. 支援 `Docker Hub` 上的所有映像，支援多使用者，支援商業實例銷售服務。
5. 支援分散式架構，一個網頁介面可以同時管理多台機器。
6. 簡單的技術堆疊，只需精通 TypeScript 即可完成整個 MCSManager 開發！
7. 更多...

<br />

## 執行環境

控制面板可以在 `Windows` 和 `Linux` 平台上執行，無需安裝資料庫，只需安裝 `Node.js` 環境和幾個**解壓縮命令**。

必須使用 [Node.js 16.20.2](https://nodejs.org/en) 或更高版本，建議使用最新的 LTS 版本。

<br />

## 官方文檔

英語：https://docs.mcsmanager.com/

中文：https://docs.mcsmanager.com/zh_cn/

<br />

## 安裝

### Windows

對於 Windows 系統，**已整合成直接運行版本，下载即可運行**:

壓縮包：https://download.mcsmanager.com/mcsmanager_windows_release.zip

雙擊 `start.bat` 即可啟動面板和守護進程。

<br />

### Linux

**一行命令快速安裝**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup_cn.sh | bash"
```

**安裝後使用**

```bash
systemctl start mcsm-{web,daemon} # 啟動面板
systemctl stop mcsm-{web,daemon}  # 停止面板
```

- 腳本僅適用於 Ubuntu/Centos/Debian/Archlinux
- 面板程式碼和執行環境會自動安裝在 `/opt/mcsmanager/` 目錄中。

<br />

**Linux 手動安裝**

- 如果一鍵安裝不工作，您可以嘗試此步驟進行手動安裝。

```bash
# 切換到安裝目錄。如果不存在，請先使用 'mkdir /opt/' 建立。
cd /opt/
# 下載執行環境（Node.js）。如果您已經安裝了 Node.js 16+，請忽略此步驟。
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# 解壓縮檔案
tar -xvf node-v20.11.0-linux-x64.tar.xz
# 將程式加入系統環境變數。
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# 準備安裝目錄。
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下載 MCSManager。
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# 安裝相依性。
chmod 775 install.sh
./install.sh

# 請開啟兩個終端機或 screen。

# 首先啟動 node 程式。
./start-daemon.sh

# 啟動網頁服務（在第二個終端機或 screen 中）。
./start-web.sh

# 訪問 http://<公開 IP>:23333/ 查看面板。
# 通常，網頁應用程式會自動掃描並連接到本地守護程式。
```

此安裝方法不會自動將面板註冊到系統服務，因此您必須使用 `screen` 軟體來管理它。如果您希望系統服務接管 MCSManager，請參考文件。

<br />

### Mac OS

```bash

# 首先安裝 Node.js，如果您已經安裝，可以跳過此步驟。
# Node.js 建議安裝最新的 LTS 版本。
brew install node
node -v
npm -v

# 使用 curl 下載檔案
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# 解壓縮檔案（與原始命令相同）
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# 安裝相依性。
chmod 775 install.sh
./install.sh

# 請開啟兩個終端機或 screen。

# 首先啟動 node 程式。
./start-daemon.sh

# 啟動網頁服務（在第二個終端機或 screen 中）。
./start-web.sh

# 訪問 http://localhost:23333/ 查看面板。
# 通常，網頁應用程式會自動掃描並連接到本地守護程式。
```

<br />

### 通過 Docker 安裝

使用 docker-compose.yml 安裝面板，請注意您需要修改裡面的所有 `<CHANGE_ME_TO_INSTALL_PATH>` 為您的實際安裝目錄。

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
      - /etc/localtime:/etc/localtime:ro
      - <CHANGE_ME_TO_INSTALL_PATH>/daemon/data:/opt/mcsmanager/daemon/data
      - <CHANGE_ME_TO_INSTALL_PATH>/daemon/logs:/opt/mcsmanager/daemon/logs
      - /var/run/docker.sock:/var/run/docker.sock
```

使用 docker-compose 啟用。

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # 這裡寫入上面的docker-compose.yml的內容
docker compose pull && docker compose up -d
```

注意：使用 Docker 安裝後，Web 端可能會無法再自動連接到 Daemon。

此時如果你進入面板，應該會出現一些錯誤，因為面板 Web 端沒有成功連接到守護進程端，你需要新建節點讓它們聯繫到一起。

<br />

## 程式碼貢獻

- 貢獻程式碼前必須閱讀：https://github.com/MCSManager/MCSManager/issues/599

- 程式碼需要維持現有格式，不允許過度的程式碼格式化。

- 所有程式碼必須符合國際化標準。

<br />

## 開發

此部分**適用於開發者**。如果您想在 MCSManager 上進行二次開發或提交程式碼貢獻，請仔細閱讀這些內容：

### 必要條件

我們使用 `Visual Studio Code` 來開發 MCSManager。您**必須安裝**這些外掛：

- i18n 文字顯示支援（I18n Ally）
- 程式碼格式化（Prettier）
- Vue - Official
- ESLint

### 相依性檔案

您需要前往 [PTY](https://github.com/MCSManager/PTY) 和 [Zip-Tools](https://github.com/MCSManager/Zip-Tools) 專案下載適合您系統的二進位檔案，將其儲存在 `daemon/lib` 目錄中（如果不存在請手動建立）以確保 `模擬終端` 和 `檔案解壓縮` 的正常運作。

下載三個相依性檔案，根據您的系統架構來選擇，並查看 Releases 找到適合您系統和架構的二進位檔案。

例如:

```bash
cd /opt/mcsmanager/daemon
mkdir lib && cd lib

# 模擬終端相依性函式庫
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64

# 解壓 & 壓縮檔案相依性函式庫
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# 7z 壓縮包支援，可選下載
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64
```

### 執行

```bash
git clone https://github.com/MCSManager/MCSManager.git

# MacOS
./install-dependents.sh
./npm-dev-macos.sh

# Windows
./install-dependents.bat
./npm-dev-windows.bat
```

### 程式碼國際化

由於專案適應多種語言，程式碼中的所有 `字串` 和 `註解` 只接受英文，因此請不要在程式碼中直接硬編碼非英文文字。

例如，您可能會寫一個需要適應多種語言的新字串。

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Check Name Failed!" // 不要這樣做！
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // 正確！
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

請將此行加入語言檔案，例如：`languages/en_US.json`

其中，`en_US.json` 是必須加入的，它是所有國家語言的來源文字，其他國家語言可以由我們使用 AI 自動翻譯。

```json
{
  //...
  "TXT_CODE_MY_ERROR": "Check Name Failed!",
  "TXT_CODE_NODE_INFO": "Jump to Node Page"
}
```

如果您安裝了 `I18n Ally` 外掛，您的 `$t("TXT_CODE_MY_ERROR")` 應該會顯示英文文字。

如果翻譯文字需要攜帶參數，這可能會有點複雜，因為前端和後端使用不同的 i18n 函式庫，所以格式可能會不同。您需要查看檔案以找到類似的程式碼來理解。

所有翻譯文字鍵不能重複，因此請嘗試使用更長的名稱！

<br />

### 建置生產環境版本

```bash
./build.bat # Windows
./build.sh  # MacOS
```

建置完成後，您會在 `production-code` 目錄中找到生產環境程式碼。

<br />

## 瀏覽器相容性

- 支援 `Chrome` `Firefox` `Safari` `Opera` 等現代主流瀏覽器。
- 已放棄對 `IE` 瀏覽器的支援。

<br />

## 錯誤回報

歡迎回報發現的任何問題，我們會迅速修復。

如果您發現不便公開的嚴重安全漏洞，請發送電子郵件至：support@mcsmanager.com。安全問題修復後，發現者的姓名將附加在程式碼中。

<br />

## 授權條款

原始碼遵循 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) 授權條款。

Copyright ©2025 MCSManager.
