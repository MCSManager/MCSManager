Independent File Manager
-----------
- 轻量级，可扩展，独立的文件在线管理模块，可重复利用于其他各类程序。


软件截图
-----------
![软件截图](http://39.108.57.206/public/README_IFM.png)

技术栈
-----------
Webpack + Vue + jQuery + Bootstrap + sweetalert2 + Express


运行环境
-----------
- `Node.js` >= 8.0

编译使用
-----------
首先进行仓库克隆，并安装依赖。
```bash
git clone https://github.com/Suwings/IndependentFileManager
cd IndependentFileManager
npm install
```
接下来我们需要编译前端文件
```bash
npm install webpack -g  #安装 Webpack
cd public
npm install
webpack                 #打包编译（非生产环境）
cd ..
```
接下来，你可以通过命令 `node app.js` 来运行这个程序；

以及再次对这个程序进行扩展，开发，与更改，新增。

**网页入口** http://localhost:port/fs_auth/ 并非根目录，这是为了方便你添加到其他程序上使用。

权限
-----------
默认的根目录位置是程序当前目录，你可以通过更改 `controller/auth.js` 来更改基本目录。

文件 `controller/auth.js`

```javascript
const BASE_DIR = process.cwd();
router.all('/', (req, res) => {
    // 你可以在这里自定义你的权限，根目录应该是什么，方便适配到你的程序。
    req.session.fsos = new FileOperateStructure(BASE_DIR, "./");
    req.session.fsoperate = {};
    req.session.fsoperate.tmp = [];
    req.session.save();
    res.redirect('/public');
});
```

基本目录结构
-----------
`public/*`      前端代码

`controller/*`  路由控制器

`model/*`       模型层

`module/*`      独立功能模块


Bug 报告
-----------
欢迎各位发现任何 BUG 及时反馈给我，必当及时修复。

您可以提供 issues 或发送邮件 `Suwings@outlook.com` 给予建议。


开源协议与版权
-----------
开源协议使用 `MIT License` ，你可以遵照此协议来使用，欢迎使用。


