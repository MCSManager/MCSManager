# Minecraft Server Manager
简单，易用，简约，轻量级的 Minecraft Server 控制面板

# 快速扩展
我们用最简单上手的方式，来构建整个应用程序，绝大部分的开发者可以轻而易举的进行修改，以及依照协议开发使用。你会发现，这可能是一非常适合你的 `Minecraft` 服务器管理工具，支持绝大部分的主流服务端。

并且，我们将尽可能的降低扩展的学习成本来帮助你更好的扩展与自定义，让一个完全属于你的`Minecraft`服务器管理器出现。

# 文档 && 使用说明
- 在开发..


# 环境需求
- `Node.js` >= 8.0
- `Java`    >= 7.0 但强烈推荐 `Java` >= 8


# 普通用户使用
- 首先您需要所说明的环境需求
```bash
git clone https://github.com/Suwings/MCSManager.git
cd mcsmanager
npm install --production
node app.js #或 npm start
```

# 构建二次开发环境 （针对开发者）
```bash
git clone https://github.com/Suwings/MCSManager.git
cd mcsmanager
npm install
```


# 项目目录结构
> `core/info.json`			数据记录文档(如果因意外中断程序乱码可以用info_reset.json覆盖)
>  
> `core/logo.txt`				控制台输出
>
> `public/`					前端所有代码
>
> `public/common/js/meum.js` 	菜单名修改
>
> `server/server_core` 		服务器核心目录
>
> `server/*.json`				服务器配置文件
>
> `users/*.json`				用户配置文件



| Name | Description |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **core/logo.txt**               |控制台输出logo文字|
| **public**                      |端所有代码|
| **public/common/js/meum.js**    |菜单名修改|
| **server/server_core**          |服务器核心目录|
| **server/x.json**               |服务器配置文件|
| **users/x.json**                |用户配置文件|


# 开源协议
- 使用 [GNU Affero General Public License v3.0](./LICENSE "GNU Affero General Public License v3.0") 协议

