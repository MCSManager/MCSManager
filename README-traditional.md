![doc_logo.png](/public/common/doc_logo.png)
  
[![Status](https://img.shields.io/badge/npm-v5.0.0-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v8.0-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://travis-ci.org/Suwings/MCSManager.svg?branch=master)](https://travis-ci.org/Suwings/MCSManager)
[![Status](https://img.shields.io/badge/License-AGPLv3-red.svg)](https://github.com/Suwings/MCSManager)


簡單，易用，多實例，輕量級的 Minecraft Server 控制面板


[中文簡體](https://github.com/Suwings/MCSManager) | [中文繁體](README-traditional.md)


<br />

快速擴展
-----------
我們用最簡單上手的方式，來構建整個應用程序，絕大部分的開發者可以輕而易舉的進行修改，以及依照協議開發使用。妳會發現，這可能是壹非常適合妳的 `Minecraft` 服務器管理工具，支持絕大部分的主流服務端。

並且，我們將盡可能的降低擴展的學習成本來幫助妳更好的擴展與自定義，讓壹個完全屬於妳的`Minecraft`服務器管理器出現。

<br />

運行環境
-----------

Node 8.0 以上

<br />


配置文件
-----------
配置文件是程序目錄下的 `property.js` 文件，它會在妳第壹次運行的時候，自動生成。

> 此文件不會與 github 版本沖突，git pull 更新時也不會自動覆蓋。

<br />


運行在 Windows 
-----------
對於 Windows 系統，已整合成直接運行版本，下載即可運行:

http://mcsm.suwings.top/ (官方站點)

**註意:** 這裏提供的下載是打包集成好的，小版本更新我們不會打包，也就是意味著，這裏不能實時跟隨最新版本。

<br />


運行在 Linux 
-----------
**提示:** 請給予 root 權限運行，如無法給予 root 權限，請編輯好文件目錄權限。

```bash
# 安裝 Node 版本控制工具(若沒有 wget,請安裝它)
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
# 關閉終端重新打開再執行以下命令
# 項目支持 8.0 版本以上，這裏使用11版本
nvm install 11.0.0
nvm use 11.0.0
# 克隆倉庫
git clone https://github.com/suwings/mcsmanager.git
# 進入目錄
cd mcsmanager/
# 安裝依賴庫
npm install
# 啟動面板
sudo npm start #或 sudo node app.js

```

> 如果您還是無法正常運行，請 [單擊這裏](https://github.com/Suwings/MCSManager/wiki/Linux-%E4%B8%8B%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8%E8%AF%A6%E8%A7%A3)

- 項目屬於**開箱即用**的面板，並未提供服務註冊功能，當終端關閉時，面板也會跟隨終端關閉。
- 可以使用 **screen** 軟件來讓面板持續在後臺運行。

<br />

通過 Docker 啟動 MC 服務端 
-----------

我們支持面板在 Linux 系統下，配合 Docker 以命令的形式，來創建 Minecraft 服務端所需 Java 環境鏡像，並且在容器中啟動和關閉妳的 Minecraft 服務端。

如果妳不會使用，請點擊`具體使用方法` 鏈接，如果妳還未安裝 Docker 請點擊 `安裝Docker` 的鏈接。

**具體使用方法:** [單擊跳轉](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_1.md)

**安裝 Docker:** [單擊跳轉](https://github.com/Suwings/MCSManager/blob/gh-pages/Question_2.md)


<br />


Wiki
---------
我們有些常見問題與細節上的問題，已經把它們都整合在 `Wiki` 裏面。

歡迎妳閱讀 [Wiki](https://github.com/Suwings/MCSManager/wiki) 與提出建議。

<br />


常見問題
-----------
| 問題 | 詳情 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
使用面板開啟 `Bedrock Server` 端 | [詳情頁](https://github.com/Suwings/MCSManager/issues/86)
面板管理員的默認賬號和密碼是什麽？ | [詳情頁](https://github.com/Suwings/MCSManager/issues/75)
面板如何正確關閉？ | Ctrl+C
配置文件是什麽？ | property.js
配好反向代理卻無法使用？ | [Apache](https://github.com/Suwings/MCSManager/issues/34) [Nginx](https://github.com/Suwings/MCSManager/issues/22)
FTP 無法使用？ | [跳轉](https://github.com/Suwings/MCSManager#ftp-%E6%9C%8D%E5%8A%A1)

<br />

項目目錄結構
-----------
**註意:** 並不是所有目錄的文件我們都建議妳進行更改！

| 目錄名 | 詳情/解釋 |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **property.js**                   |控制面板配置文件|
| **core/logo.txt**               |控制臺輸出 logo 文字|
| **public/**                      |前端所有代碼，資源目錄，前後端分離，使用 ws 和 ajax 通訊|
| **public/login/**                |純 UI 邏輯登陸頁面|
| **public/template/**             |前端業務模板，每個模板擁有著壹個生命周期，開始與結束。|
| **public/onlinefs_public/**      |文件在線管理模塊前端所有代碼|
| **public/common/js/meum.js**     |控制面板左側菜單列表|
| **public/common/js/login.js**    |通用登錄流程邏輯，可重復利用在各類 HTML 登錄模板|
| **server/server_core**           |Minecraft 服務端核心目錄，包括服務端文件，配置，Mod，以及插件|
| **server/x.json**               |Minecraft 服務器面板配置文件|
| **users/x.json**                |控制面板用戶配置文件|
| **route/**                      |控制器，HTTP 請求業務邏輯層（可二次擴展）|
| **route/websocket/**            |控制器，Webscoket 請求業務邏輯層（可二次擴展）|
| **core/Process/**                |Minecraft Server 類實現|
| **core/User/**                   |User 類實現|
| **core/DataModel.js**            |數據持久化模型，幾乎是所有的配置的 I/O 模型|
| **model/**                      |模型層，用於提供控制器與服務端，用戶操作，也提供設計模式模型|
| **helper/**                     |業務邏輯輔助層，用於輔助和重復利用業務邏輯|
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
妳可以對前端以及後端進行任何程度的修改，包括版權聲明。


<br />

FTP 服務
-----------
FTP 模塊采用被動傳輸模式，傳輸命令默認使用 `10022`(可更改) 端口；

傳輸數據需要壹個端口段，默認是 `20010` - `20100`；

為確保 FTP 服務正常使用，請配置好您的防火墻設置，對這些端口範圍進行開放。

> 此功能未來版本有可能會刪除，使用已有的在線文件管理完全代替。

<br />

反向代理 與 SSL
-----------

盡管默認沒有 Https ，您可能在公共網絡下不太放心，但是我們不傳遞明文的密碼，可以保證妳的賬號的密碼是難以泄露的。

具體密碼傳遞過程可參考 [單擊這裏跳轉](https://github.com/Suwings/MCSManager/wiki/%E7%99%BB%E5%BD%95%E5%AF%86%E7%A0%81%E4%BC%A0%E9%80%92%E8%BF%87%E7%A8%8B%E5%9B%BE)

**Property 文件**

反向代理之前，妳可以但不是必須閱讀 `property.js` 文件

> 裏面有各類的設置，包括 gzip壓縮，端口和ip綁定等等。

**實現 HTTPS 與 WSS**

打開前端 URL 定位文件 `public/common/URL.js`, 將 http 與 ws 改成 https 與 wss；

可保證前端所有請求均為 https 和 wss
> 此文件不會與 github 版本沖突，更新時也不會覆蓋，請放心修改。

**反向代理**

後端請通過反向代理完成，或自行修改 Express 初始化 App。

[Apache 反向代理教程](https://github.com/Suwings/MCSManager/wiki/%E4%BD%BF%E7%94%A8-Apache2.4-%E8%BF%9B%E8%A1%8C%E5%8F%8D%E5%90%91%E4%BB%A3%E7%90%86)

**註意:** [Nginx 反向代理註意](https://github.com/Suwings/MCSManager/issues/22)  | [Apache 反向代理註意](https://github.com/Suwings/MCSManager/issues/34)  | [關於 Caddy 反向代理坑](https://github.com/Suwings/MCSManager/issues/122)

<br />

權限系統
-----------
尤其註意的是，為了更加簡化面板權限系統，我們只分為兩種賬號。

`管理賬號` 凡是以 # 字符開頭的用戶，均為管理賬號，列如 `#master` `#admin` `#test`

`普通賬號` 不以 # 字符開頭的用戶，列如 `test` `usernameww` `xxx`

普通賬號能夠管理的服務器只能由管理賬號來進行設定，管理賬號可以管理任何服務器，並且能管理所有用戶。

具體使用，我想妳只需要運行就知道，設計的十分簡單。

<br />

問題報告
-----------
歡迎各位發現任何 BUG 及時反饋給我，必當及時修復。

<br />

協議與版權
-----------
程序是基於 [GNU Affero General Public License v3.0](./LICENSE "GNU Affero General Public License v3.0")  開放源代碼的自由軟件。

妳可以遵照 AGPLv3 協議來修改和重新發布這壹程序。

或者，在學習或私自 (內部) 使用時，在不公開發布的原則下，可以無視這個**協議和版權**，因為這本身並不能束縛妳，並且我們歡迎這樣做。

<br />
