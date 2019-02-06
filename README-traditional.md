![doc_logo.png](/public/common/doc_logo.png)
  
[![Status](https://img.shields.io/badge/npm-v4.16.3-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v8.0-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://travis-ci.org/Suwings/MCSManager.svg?branch=master)](https://travis-ci.org/Suwings/MCSManager)
[![Status](https://img.shields.io/badge/License-AGPLv3-red.svg)](https://github.com/Suwings/MCSManager)


簡單，易用，多實例，輕量級的 Minecraft Server 控制面板

**This project does not support English.**

[中文簡體](https://github.com/Suwings/MCSManager) | [中文繁體](README-traditional.md)


<br />

快速擴展
-----------
我們用最簡單上手的方式，來構建整個應用程序，絕大部分的開發者可以輕而易舉的進行修改，以及依照協議開發使用。你會發現，這可能是一非常適合你的 `Minecraft` 伺服器管理工具，支持絕大部分的主流服務端。

並且，我們將儘可能的降低擴展的學習成本來幫助你更好的擴展與自定義，讓一個完全屬於你的`Minecraft`伺服器管理器出現。

<br />

運行環境
-----------
- 我們的部署簡單至極，在`Master`分支下，我們的設計是下載即可運行，不需要編譯與任何配置，除了安裝一個環境。

- `Node.js` >= 8.0
- `下載鏡像站點`: [https://npm.taobao.org/mirrors/node/v8.0.0/](https://npm.taobao.org/mirrors/node/v8.0.0/)

<br />


運行在 Windows 
-----------

**方法一 (僅限中文簡體)**

下載並正確安裝 `Node` 環境:

下載源代碼並解壓: [https://github.com/Suwings/MCSManager/archive/master.zip](https://github.com/Suwings/MCSManager/archive/master.zip)

進入程序源代碼目錄，並且在當前目錄打開命令控制台

執行命令 `npm install --production`

執行命令 `node app.js` 或 `npm start`


**方法二 (包含簡體/繁體版本)**

可能因為某些原因，您可能並不願意安裝這些運行環境，於是我們給予了一種綠色打包的運行環境，下載即可直接使用。

下載直接運行:

http://mcsm.suwings.top/ (官方站點 有中文簡體/繁體中文版本)


**注意:** 百度網盤提供的下載是打包集成好的，小版本更新我們不會打包，也就是意味著，這裡不能實時跟隨最新版本。

<br />


運行在 Linux 
-----------
- 相對而言，這可能更加簡單。保證您的 node 版本正確與 git 工具可行下，安裝與運行易如反掌。

**提示:** 請儘可能的給予 root 許可權運行，如無法給予 root 許可權，請編輯好文件目錄許可權，如使用 Docker 等服務不保證能夠完全正確運行。

```bash
git clone https://github.com/Suwings/MCSManager.git
cd MCSManager
npm install --production
sudo node app.js #或 sudo npm start
```

> 如果您還是無法運行，請 [單擊這裡](https://github.com/Suwings/MCSManager/wiki/Linux-%E4%B8%8B%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3)

<br />

使用 Docker 
-----------
**我們支持 Docker 軟體** 我們使用 Docker 來進行虛擬化部署，縱使您的機器上沒有 Java 任何環境，只需一個 Docker 就能輕鬆開啟 Minecraft 伺服器。

另外使用 Docker 也能保證您的宿主機安全性和穩定性，對 Linux 客戶而言相信使用起來會更好。

如何使用？打開軟體界面，單擊 `創建 Docker 鏡像`，隨後在參數面板設置 `Docker 配置` 即可。

**如需使用 Docker ，請確保您的 Linux 系統擁有 Docker 環境，並且啟動服務。**


我們設計得十分簡單，但是如果您依然擔心您不會操作，可以參考以下相關信息：

具體使用方法: [單擊此處跳轉](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_1.md)

安裝 Docker: [單擊此處跳轉](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_2.md)
<br />


Wiki
---------
我們有些常見問題與細節上的問題，已經把它們都整合在 `Wiki` 裡面。

歡迎你閱讀 [Wiki](https://github.com/Suwings/MCSManager/wiki) 與提出建議。

<br />

項目目錄結構
-----------
**注意:** 並不是所有目錄的文件我們都建議你進行更改！

| 目錄名 | 詳情/解釋 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **property.js**                   |控制面板配置文件|
| **core/logo.txt**               |控制台輸出 logo 文字|
| **public/**                      |前端所有代碼，資源目錄，前後端分離，使用 ws 和 ajax 通訊|
| **public/login/**                |純 UI 邏輯登陸頁面|
| **public/template/**             |前端業務模板，每個模板擁有著一個生命周期，開始與結束。|
| **public/onlinefs_public/**      |文件在線管理模塊前端所有代碼|
| **public/common/js/meum.js**     |控制面板左側菜單列表|
| **public/common/js/login.js**    |通用登錄流程邏輯，可重複利用在各類 HTML 登錄模板|
| **server/server_core**           |Minecraft 服務端核心目錄，包括服務端文件，配置，Mod，以及插件|
| **server/x.json**               |Minecraft 伺服器面板配置文件|
| **users/x.json**                |控制面板用戶配置文件|
| **route/**                      |控制器，HTTP 請求業務邏輯層（可二次擴展）|
| **route/websocket/**            |控制器，Webscoket 請求業務邏輯層（可二次擴展）|
| **core/Process/**                |Minecraft Server 類實現|
| **core/User/**                   |User 類實現|
| **core/DataModel.js**            |數據持久化模型，幾乎是所有的配置的 I/O 模型|
| **model/**                      |模型層，用於提供控制器與服務端，用戶操作，也提供設計模式模型|
| **helper/**                     |業務邏輯輔助層，用於輔助和重複利用業務邏輯|
| **ftpd/**                       |FTP 獨立模塊，其中 ftpserver.js 已經實現了抽象 ftpServerInterface 介面|
| **onlinefs/**                    |文件管理獨立模塊 ([Suwings/IndependentFileManager](https://github.com/Suwings/IndependentFileManager))|

<br />

瀏覽器兼容性
-----------
- `ECMAScript 5` 標準
- `IE 10+` `Chrome` `Firefox` `Safari` `Opera` 等現代主流瀏覽器

**例外:** 文件在線管理界面需要 `IE 11+` 

<br />


配置文件
-----------
我們的配置文件是程序目錄下的 `property.js` 文件，它會在你第一次運行的時候，自動生成。

> 注意！原舊版本的 McserverConfig.json 文件完全棄用。

> 現在，所有配置將全部歸納於此文件。

> 此文件不會與 github 版本衝突，更新時也不會自動覆蓋

<br />


自定義設計
-----------
如果你是內部使用或學慣用途，你可以對前端以及後端進行任何修改，包括版權聲明。

> 注意！當你進行版本更新的時候，可能會覆蓋掉你的自定義修改部分。

> 當然，並不是所有文件都需要覆蓋一遍，也不一定非得使用新版本。

<br />

FTP 服務
-----------
FTP 模塊採用被動傳輸模式，傳輸命令默認使用 `10022`(可更改) 埠；

傳輸數據需要一個埠段，默認是 `20010` - `20100`；

為確保 FTP 服務正常使用，請配置好您的防火牆設置，對這些埠範圍進行開放。

> 當然，我們提供了在線文件管理功能，您大可不必完全使用 FTP。

<br />

反向代理 與 SSL
-----------

儘管默認沒有 Https ，您可能在公共網路下不太放心，但是我們不傳遞明文的密碼，可以保證你的賬號的密碼是難以泄露的。

具體密碼傳遞過程可參考 [單擊這裡跳轉](https://github.com/Suwings/MCSManager/wiki/%E7%99%BB%E5%BD%95%E5%AF%86%E7%A0%81%E4%BC%A0%E9%80%92%E8%BF%87%E7%A8%8B%E5%9B%BE)

**Property 文件**

反向代理之前，你可以但不是必須閱讀 `property.js` 文件

> 裡面有各類的設置，包括 gzip壓縮，埠和ip綁定等等。

**實現 HTTPS 與 WSS**

打開前端 URL 定位文件 `public/common/URL.js`, 將 http 與 ws 改成 https 與 wss；

可保證前端所有請求均為 https 和 wss
> 此文件不會與 github 版本衝突，更新時也不會覆蓋，請放心修改。

**反向代理**

後端請通過反向代理完成，或自行修改 Express 初始化 App。

**注意:** [Nginx 反向代理注意](https://github.com/Suwings/MCSManager/issues/22)  | [Apache 反向代理注意](https://github.com/Suwings/MCSManager/issues/34)

<br />

許可權系統
-----------
尤其注意的是，為了更加簡化面板許可權系統，我們只分為兩種賬號；

`管理賬號` 凡是以 # 字元開頭的用戶，均為管理賬號，列如 `#master` `#admin` `#test`

`普通賬號` 不以 # 字元開頭的用戶，列如 `test` `usernameww` `xxx`

普通賬號能夠管理的伺服器只能由管理賬號來進行設定，管理賬號可以管理任何伺服器，並且能管理所有用戶。

具體使用，我想你只需要運行就知道，設計的十分簡單。

<br />

問題報告
-----------
歡迎各位發現任何 BUG 及時反饋給我，必當及時修復

<br />

協議與版權
-----------
程序是基於 [GNU Affero General Public License v3.0](./LICENSE "GNU Affero General Public License v3.0")  開放源代碼的自由軟體。

你可以遵照 AGPLv3 協議來修改和重新發布這一程序。

或者，在學習或私自 (內部) 使用時，在不公開發布的原則下，可以無視這個**協議和版權**，因為這本身並不能束縛你，並且我們歡迎這樣做。

<br />
