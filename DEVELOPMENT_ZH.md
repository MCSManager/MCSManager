## 搭建开发环境

此段落**面向开发人员**，如果你想对 MCSManager 进行开发，或者提交代码贡献，请务必仔细的阅读这些内容：

### 所需环境

- Node.js v16+

我们使用 `Visual Studio Code` 开发 MCSManager，我们**极力推荐**这些插件：

- i18n 文案显示支持（I18n Ally）
- 代码格式化（Prettier）
- Vue - Offcial
- ESLint

<br />

### 开始搭建

#### 1. 下载源代码

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
```

#### 2. 下载二进制依赖文件

你需要前往 [PTY](https://github.com/MCSManager/PTY/releases) 和 [Zip-Tools](https://github.com/MCSManager/Zip-Tools/releases) 两个项目下载适用于你的系统的二进制文件，将他们存放到 `daemon/lib` 目录下（不存在就手动创建），以确保 `仿真终端` 和 `文件解压缩` 的正常工作。

下载三个依赖文件，需要根据自己的系统架构来选择，查看 Releases 可以找到适合自己系统和架构的二进制文件。

例如:

```bash
# 手动新建二进制依赖库文件夹
mkdir lib && cd lib

# 仿真终端依赖库
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64
# wget https://github.com/MCSManager/PTY/releases/download/latest/pty_darwin_arm64 # MacOS Arm 架构

# 解压 & 压缩文件依赖库
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# 7z 压缩包支持（可选）
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64


# 其他 OS & CPU 架构请前往这里下载：
# PTY: https://github.com/MCSManager/PTY/releases
# Zip-Tools: https://github.com/MCSManager/Zip-Tools/releases
# 7z: https://github.com/MCSManager/Zip-Tools/releases

```

#### 3. 安装 Node.js 依赖库

```bash

# MacOS / Linux
./install-dependents.sh

# Windows
./install-dependents.bat
```

#### 4. 运行 MCSManager

```bash
npm run dev
```

<br />

### 国际化你的代码

由于项目适配多国语言，所以代码中的所有 `字符串`，`注释` 都只接受英文，所以请勿直接硬文本非英语在代码中。

比如你可能写了一行新的字符串，需要适配多国语言。

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Hello，这是一个错误！"; // 不要这样做！
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // 正确做法
}

// 带参数的使用方式
const errorMsgWithParams = $t("TXT_CODE_INSTANCE_ERROR", {
  uuid: instance.instanceUuid,
  err: err
});
```

languages/en_US.json

```json
{
  // 所有的翻译文案 Key，不可有重复，所以请可能的取一个较长的名字！
  "TXT_CODE_MY_ERROR": "Hello，这是一个错误！",
  // 如果需要携带参数，使用两个花括号
  "TXT_CODE_INSTANCE_ERROR": "Exception instance {{uuid}}: {{err}}"
}
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

    <!-- 如果需要携带参数，前端代码使用一个花括号 -->
    <div>{{ t("TXT_CODE_FILE_ERROR", { name: props.fileName }) }}</div>
  </a-menu-item>
</template>
```

languages/en_US.json

```json
{
  "TXT_CODE_NODE_INFO": "Jump to Node Page",
  // 如果需要携带参数，前端代码使用一个花括号
  "TXT_CODE_FILE_ERROR": "File {name} error!"
}
```

请在语言文件中新增这一行，比如：`languages/en_US.json`

> 所有语言的文案都在 `languages/*.json` 中，所有翻译以 `en_US.json` 为准，所以如果你修改了任何文案，或者新增了任何文件 `en_US.json` 是**必须修改和新增**的，它是所有国家语言的源文案，其他国家的语言可以由我们使用 AI 来自动翻译。

如果你安装了 `I18n Ally` 插件，你的 `$t("TXT_CODE_MY_ERROR")` 应该会浮现对应的文案。

<br />

### 构建生产环境版本

```bash
./build.bat # Windows
./build.sh  # MacOS
```

构建完成后，你会在 `production-code` 目录下找到生产环境代码。

<br />

### 最后

更多内容，请移步到官方文档进行翻阅。

https://docs.mcsmanager.com/ops/mcsm_network.html
