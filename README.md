## Minecraft Manager
简单，易用，简约，轻量级的 Minecraft 控制面板

### 快速上手
我们用最简单上手的方式，来构建整个应用程序，绝大部分的开发者可以轻而易举的进行修改，以及依照协议开发使用。你会发现，这可能是一非常适合你的 `Minecraft` 服务器管理工具，支持绝大部分的主流服务端。

### 文档 && 使用说明
正在开发..

### 下载与使用（普通用户）
> 请访问临时站点 [http://honery.zqstudio.top/mcserver_manager/](http://honery.zqstudio.top/mcserver_manager/) 


### 构建二次开发环境 （针对开发者）
```
git clone https://github.com/Suwings/Mc-manager.git
```


### 环境需求
- `Node.js` >= 8.0
- `Java`    >= 7.0 但强烈推荐 `Java` 8


### 基本目录解释
> `core/info.json`			数据记录文档(如果因意外中断程序乱码可以用info_reset.json覆盖)
>  
> `core/logo.txt`				控制台输出
>
> `public/`					前端所有代码(压缩)
> `public_src/`				前端所有代码，如果你想更改前端，请用这个覆盖public/
> `public/common/js/meum.js` 	菜单名修改
>
> `server/server_core` 		服务器核心目录
> `server/*.json`				服务器配置文件
>
> `users/*.json`				用户配置文件

### 开源协议
> 采用 [AGPL](./LICENSE "AGPL") 协议
