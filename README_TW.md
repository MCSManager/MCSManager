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

[官方網站](http://mcsmanager.com/) | [教學說明](https://docs.mcsmanager.com/#/zh-cn/) | [TG 群組](https://t.me/MCSManager_dev) | [成為贊助者](https://afdian.net/a/mcsmanager)

[English](README.md) | [简体中文](README_ZH.md) | [Deutsch](README_DE.md) | [Português BR](README_PTBR.md) |
[日本語](README_JP.md) | [Spanish](README_ES.md)

</div>

<br />

## 這是什麼？

**MCSManager 面板**（簡稱：MCSM 面板）是一款免費，開源，分散式，輕量級，快速部署，支援 Minecraft 和 Steam 遊戲伺服器的 Web 管理面板。

此軟體在 `Minecraft` 和其他遊戲社群內中已有一定的流行程度，它可以幫助你集中管理多個實體伺服器，實現在任何主機上建立遊戲伺服器，並且提供安全可靠的多使用者權限系統，可以很輕鬆的幫助你管理多個伺服器，一直在為 `Minecraft`，`Terraria` 和 `Steam` 遊戲伺服器的管理員，維護人員和個人開發者提供健康的軟體支援。

![截圖載入失敗，請科學上網.png](/.github/panel-image.png)

![截圖載入失敗，請科學上網.png](/.github/panel-instances.png)

<br />

## 功能特性

1. 支援快速開服！ 輕鬆部署 `Minecraft` Java 版/基岩版遊戲伺服器。
2. 相容於大部分 `Steam` 遊戲伺服器，例如 `幻獸帕魯`，`Squad`，`Project Zomboid` 和 `Terraria` 等。
3. 網頁支援拖拉式的小卡片佈局，打造自己喜歡的介面佈局。
4. 支援 `Docker` 虛擬化，支援多使用者，支援商業出租行為。
5. 支援所有 `Docker` 映像，輕鬆打造預設！
6. 支援分散式，一個網頁即可同時管理數台機器。
7. 更多...

<br />

## 執行環境

控制面板可執行在 `Windows` 與 `Linux` 平台，無需安裝資料庫，只需安裝 `Node.js` 環境和幾個**用於解壓縮**的指令。

必須使用 [Node.js 16.20.2](https://nodejs.org/en) 以上，建議使用最新版本 LTS 版本。

<br />

## 安裝

### Windows

對於 Windows 系統，**已整合成快速啟動版本，下載即可執行**:

前往：[https://mcsmanager.com/](https://mcsmanager.com/)

<br />

### Linux

**快速安裝**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**安裝後的使用方法**

```bash
systemctl start mcsm-{web,daemon} # 開啟面板
systemctl stop mcsm-{web,daemon} # 關閉面板

```

- 快速安裝指令只適用於 Ubuntu/Centos/Debian/Archlinux。
- 面板程式碼與執行環境自動安裝在 `/opt/mcsmanager/` 資料夾下。

<br />

**Linux 手動安裝**

- 若快速安裝無法使用，則可以嘗試此步驟手動安裝。

```bash

# 切換到安裝資料夾。 如果沒有這個資料夾，請先輸入 mkdir /opt/ 新增它。

cd /opt/

# 下載執行環境（Node.js）。 如果你已經安裝了 Node.js 16+，請忽略此步驟。

wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz

# 解壓縮檔案

tar -xvf node-v20.11.0-linux-x64.tar.xz

# 新增程式到系統環境變數

ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# 準備好安裝資料夾

mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下載 MCSManager

wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# 安裝函式庫

./install.sh

# 請開啟兩個終端機或 screen

# 先啟動節點程式

./start-daemon.sh

# 啟動網頁服務(在第二個終端機或 screen)

./start-web.sh

# 進入 http://localhost:23333/ 開始使用

# 一般來說，網頁服務會自動掃描並連接到本機節點。

```

這種安裝方式不會自動註冊系統服務(Service)，所以必須使用 `screen` 軟體來管理，如果你希望由系統服務來接管 MCSManager，請參考文件。

<br />

## 瀏覽器相容性

- 支援 `Chrome` `Firefox` `Safari` `Opera` 等現代主流瀏覽器。
- 已放棄支援 `IE` 瀏覽器。

<br />

## 建立開發環境

這是給開發人員使用的，一般使用者可直接跳過這個環節。

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

### 編譯正式環境版本

```bash
./build.bat # Windows
./build.sh # MacOS

```

接下來你還需要前往 [PTY](https://github.com/MCSManager/PTY) 和 [Zip-Tools](https://github.com/MCSManager/Zip-Tools) 兩個專案下載對應的檔案，將他們存放到 `daemon/lib` 目錄下，以確保 `模擬終端機` 和 `解壓縮檔案` 正常運作。

<br />

## 貢獻程式碼

如果你在使用過程中發現任何問題，可以 [提交 Issue](https://github.com/MCSManager/MCSManager/issues/new/choose) 或自行 Fork 修改後提交 Pull Request。

程式碼需保持現有格式，不得刪除多餘程式碼，具體可[參考這裡](https://github.com/MCSManager/MCSManager/issues/544)。

<br />

## 回報 BUG

歡迎回報發現到的任何問題，將會快速修復。

若發現嚴重安全漏洞又不方便公開發布，請 E-mail 至: support@mcsmanager.com，安全問題修復後將在程式碼中附加漏洞發現者姓名。

<br />

## 國際化

感謝下列成員提供的**大量**翻譯檔案：

- [KevinLu2000](https://github.com/KevinLu2000)
- [Unitwk](https://github.com/unitwk)
- [JianyueLab](https://github.com/JianyueLab)
- [IceBrick](https://github.com/IceBrick01)

<br />

## 原始碼協定

原始碼遵循 [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) 協定。

Copyright ©2025 MCSManager.
