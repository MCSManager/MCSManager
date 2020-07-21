![doc_logo.png](/public/common/doc_logo.png)
  
[![Status](https://img.shields.io/badge/npm-v6.9.0-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v10.16.0-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://travis-ci.org/Suwings/MCSManager.svg?branch=master)](https://travis-ci.org/Suwings/MCSManager)
[![Status](https://img.shields.io/badge/License-MIT-red.svg)](https://github.com/Suwings/MCSManager)


簡單，易用，多實例，輕量級的 Minecraft Server 控制面板 



[中文簡體](https://github.com/Suwings/MCSManager) | [中文繁體](README-traditional.md) |  [API 文檔](https://github.com/Suwings/MCSManager/wiki) 

<br />

**本項目 [贊助者名單](https://docs.qq.com/sheet/DYWJNVXhib0dtamh2?c=B3A0A0)**
<br />

簡介
-----------
這是一款可以管理多個 Minecraft 服務端（支持群組端）的 Web 管理面板，並且可以分配多個子賬號來分別管理不同的 Minecraft 服務端，支持絕大部分主流的服務端，甚至是其他非 Minecraft 的程序。

控制面板可運行在 Windows 與 Linux 平台，無需數據庫與任何系統配置，只需安裝 node 環境即可快速運行，屬於輕量級的 Minecraft 服務端控制面板。

![main_theme.png](/public/common/main_theme.png)

<br />

運行環境
-----------

推薦 `Node 10.16.0` 以上，無需數據庫和更改任何系統配置，開箱即可運行。


<br />


配置文件
-----------
配置文件是程序目錄下的 `property.js` 文件，它會在你第一次運行的時候，自動生成。

> 此文件不會與 github 版本衝突，git pull 更新時也不會自動覆蓋。

<br />


常見問題
-----------
| 問題 | 詳情 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
無法正常安裝面板？| [參考教程](https://github.com/Suwings/MCSManager/wiki/Linux-%E4%B8%8B%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3)
Linux 下面板如何後台運行？ | [參考方法](https://github.com/Suwings/MCSManager/wiki/Linux-%E4%B8%8B%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3#%E4%BF%9D%E6%8C%81%E5%90%8E%E5%8F%B0%E8%BF%90%E8%A1%8C)
使用面板開啟 `Bedrock Server` 端 | [參考教程](https://github.com/Suwings/MCSManager/wiki/%E4%BD%BF%E7%94%A8%E9%9D%A2%E6%9D%BF%E5%BC%80%E5%90%AF-Bedrock_server-%E6%9C%8D%E5%8A%A1%E7%AB%AF)
面板管理員的默認賬號和密碼是什麼？ | 賬號 `#master` 密碼 `123456`
面板如何正確關閉？ | `Ctrl+C`
配置文件是什麼？ | `property.js` 文件
如何修改面板默認端口？ | `property.js` 文件
如何配置反向代理？ | [Apache 配置參考教程](https://github.com/Suwings/MCSManager/wiki/%E4%BD%BF%E7%94%A8-Apache2.4-%E8%BF%9B%E8%A1%8C%E5%8F%8D%E5%90%91%E4%BB%A3%E7%90%86)
配好反向代理卻無法使用？ | [Apache](https://github.com/Suwings/MCSManager/issues/34) [Nginx](https://github.com/Suwings/MCSManager/issues/22) [寶塔上的Nginx](https://github.com/Suwings/MCSManager/wiki/%E5%85%B3%E4%BA%8E%E5%AE%9D%E5%A1%94%E9%9D%A2%E6%9D%BF%E7%9A%84-Nginx-%E5%8F%8D%E5%90%91%E4%BB%A3%E7%90%86%E4%BB%A5%E5%8F%8ASSL%E8%AF%81%E4%B9%A6%E9%83%A8%E7%BD%B2)
FTP 無法使用？ | [跳轉](https://github.com/Suwings/MCSManager#ftp-%E6%9C%8D%E5%8A%A1)
反代後文件管理偶爾失效? | 請檢查反代機器的防火牆是否攔截
我能修改登錄頁面嗎？| [修改教程](https://github.com/Suwings/MCSManager/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BF%AE%E6%94%B9%E7%99%BB%E5%BD%95%E9%A1%B5%E9%9D%A2)
其他常見問題 | [查看 Wiki](https://github.com/Suwings/MCSManager/wiki)
關於HTTP跳轉HTTPS的幫助 | [查看 Nginx 301永久重定向 範例](https://github.com/Suwings/MCSManager/wiki/Nginx%E5%85%A8%E5%B1%80301%E6%B0%B8%E4%B9%85%E9%87%8D%E5%AE%9A%E5%90%91)


<br />




運行在 Windows 
-----------
對於 Windows 系統，已整合成直接運行版本，下載即可運行(建議使用管理員權限運行):



http://mcsm.suwings.top/ (官方站點)

**注意:** 這裏提供的下載是打包集成好的，小版本更新我們不會打包，也就是意味着，這裏不能實時跟隨最新版本。

<br />


運行在 Linux 
-----------
**提示:** 請給予 root 權限運行，如無法給予 root 權限，請編輯好文件目錄權限。

```bash
# 安裝 Node 版本控制工具(若沒有 wget,請安裝它)
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
# 關閉終端重新打開再執行以下命令
# 項目支持 10.0 版本以上，這裏使用11版本
nvm install 11.0.0
nvm use 11.0.0
# 克隆倉庫
git clone https://github.com/suwings/mcsmanager.git
# 進入目錄
cd mcsmanager/
# 安裝依賴庫
npm install
# 啟動面板
npm start 
# 或者 node app.js

```

> 詳細安裝以及使用教程，請 [單擊這裏](https://github.com/Suwings/MCSManager/wiki/Linux-%E4%B8%8B%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3)  
- 項目屬於**開箱即用**的面板，如果不使用 **screen** 進行後台常駐.當你斷開了SSH後,面板也會隨之關閉.
- **screen** 需要單獨安裝,執行安裝指令"yum -y install screen"或"apt -y install screen"

<br />

通過 Docker 啟動 MC 服務端 
-----------

我們支持面板在 Linux 系統下，配合 Docker 以命令的形式，來創建 Minecraft 服務端所需 Java 環境鏡像，並且在容器中啟動和關閉你的 Minecraft 服務端。

如果你不會使用，請點擊`具體使用方法` 連結，如果你還未安裝 Docker 請點擊 `安裝Docker` 的連結。

**具體使用方法:** [單擊跳轉](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_1.md)

**安裝 Docker:** [單擊跳轉](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_2.md)


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
| **public/template/**             |前端業務模板，每個模板擁有着一個生命周期，開始與結束。|
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
| **ftpd/**                       |FTP 獨立模塊，其中 ftpserver.js 已經實現了抽象 ftpServerInterface 接口|
| **onlinefs/**                    |文件管理獨立模塊 ([Suwings/IndependentFileManager](https://github.com/Suwings/IndependentFileManager))|

<br />

瀏覽器兼容性
-----------
- `ECMAScript 5` 標準
- `IE 10+` `Chrome` `Firefox` `Safari` `Opera` 等現代主流瀏覽器

**例外:** 文件在線管理界面需要 `IE 11+` 

<br />



自定義設計
-----------
你可以對前端以及後端進行任何程度的修改，包括版權聲明。


<br />

FTP 服務
-----------

FTP 模塊默認為關閉狀態.開啟選項在 property.js 文件中 但不建議使用

採用被動傳輸模式，傳輸命令默認使用 `10022`(可更改) 端口；

傳輸數據需要一個端口段，默認是 `20010` - `20100`；

為確保 FTP 服務正常使用，請配置好您的防火牆設置，對這些端口範圍進行開放。

> 此功能未來版本有可能會刪除，使用已有的在線文件管理完全代替。

<br />

反向代理 與 SSL
-----------

儘管默認沒有 Https ，您可能在公共網絡下不太放心，但是我們不傳遞明文的密碼，可以保證你的賬號的密碼是難以泄露的。

具體密碼傳遞過程可參考 [單擊這裏跳轉](https://github.com/Suwings/MCSManager/wiki/%E7%99%BB%E5%BD%95%E5%AF%86%E7%A0%81%E4%BC%A0%E9%80%92%E8%BF%87%E7%A8%8B%E5%9B%BE)

**Property 文件**

反向代理之前，建議你閱讀 `property.js` 文件

> 裏面有各類的設置，包括 gzip壓縮，端口和ip綁定等等。

**實現 HTTPS 與 WSS**

打開前端 URL 定位文件 `public/common/URL.js`, 將 http 與 ws 改成 https 與 wss；

可保證前端所有請求均為 https 和 wss，但是後端方面還需要配置 SSL 與 反向代理。

**反向代理**

後端請通過反向代理完成，或自行修改 Express 初始化 App。

[Apache 反向代理教程](https://github.com/Suwings/MCSManager/wiki/%E4%BD%BF%E7%94%A8-Apache2.4-%E8%BF%9B%E8%A1%8C%E5%8F%8D%E5%90%91%E4%BB%A3%E7%90%86)

[SSL 功能實現示例](https://github.com/Suwings/MCSManager/issues/146)

**注意:** [Nginx 反向代理注意](https://github.com/Suwings/MCSManager/issues/22)  | [Apache 反向代理注意](https://github.com/Suwings/MCSManager/issues/34)  | [關於 Caddy 反向代理坑](https://github.com/Suwings/MCSManager/issues/122)

<br />

權限系統
-----------
尤其注意的是，為了更加簡化面板權限系統，我們只分為兩種賬號。

`管理賬號` 凡是以 # 字符開頭的用戶，均為管理賬號，列如 `#master` `#admin` `#test`

`普通賬號` 不以 # 字符開頭的用戶，列如 `test` `usernameww` `xxx`

普通賬號能夠管理的伺服器只能由管理賬號來進行設定，管理賬號可以管理任何伺服器，並且能管理所有用戶。

具體使用，我想你只需要運行就知道，設計的十分簡單。

<br />

問題報告
-----------
歡迎各位發現任何 BUG 及時反饋給我，必當及時修復。

<br />

開源協議
-----------
MIT License

<br />
