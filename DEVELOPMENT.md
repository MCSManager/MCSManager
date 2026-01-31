## Setting Up Development Environment

This section is **for developers**. If you want to develop MCSManager or contribute code, please read this content carefully:

### Required Environment

- Node.js v16+

We use `Visual Studio Code` to develop MCSManager, we **highly recommend** these plugins:

- i18n Text Display Support (I18n Ally)
- Code Formatting (Prettier)
- Vue - Official
- ESLint

<br />

### Getting Started

#### 1. Download the Source Code

```bash
git clone https://github.com/MCSManager/MCSManager.git
cd MCSManager
```

#### 2. Download Binary Dependency Files

You need to visit the [PTY](https://github.com/MCSManager/PTY/releases) and [Zip-Tools](https://github.com/MCSManager/Zip-Tools/releases) projects to download binary files compatible with your system, and place them in the `daemon/lib` directory (create it manually if it doesn't exist) to ensure the proper functioning of the `simulated terminal` and `file decompression`.

Download three dependency files, selecting them based on your system architecture. Check the Releases to find binary files suitable for your system and architecture.

For example:

```bash
# Manually create binary dependency library folder
mkdir lib && cd lib

# Simulated terminal dependency library
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64
# wget https://github.com/MCSManager/PTY/releases/download/latest/pty_darwin_arm64 # MacOS Arm architecture

# Decompression & compression file dependency library
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# 7z archive support (optional)
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64


# For other OS & CPU architectures, please download from here:
# PTY: https://github.com/MCSManager/PTY/releases
# Zip-Tools: https://github.com/MCSManager/Zip-Tools/releases
# 7z: https://github.com/MCSManager/Zip-Tools/releases

```

#### 3. Install Node.js Dependencies

```bash

# MacOS / Linux
./install-dependents.sh

# Windows
./install-dependents.bat
```

#### 4. Run MCSManager

```bash
npm run dev
```

<br />

### Internationalizing Your Code

Since the project supports multiple languages, all `strings` and `comments` in the code must be in English only. Do not hardcode non-English text directly in the code.

For example, if you write a new string that needs to support multiple languages:

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Hello，这是一个错误！"; // Don't do this!
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // Correct approach
}

// Usage with parameters
const errorMsgWithParams = $t("TXT_CODE_INSTANCE_ERROR", {
  uuid: instance.instanceUuid,
  err: err
});
```

languages/en_US.json

```json
{
  // All translation text Keys must be unique, so please use a longer name if possible!
  "TXT_CODE_MY_ERROR": "Hello，这是一个错误！",
  // If parameters are needed, use double curly braces
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

    <!-- If parameters are needed, frontend code uses single curly braces -->
    <div>{{ t("TXT_CODE_FILE_ERROR", { name: props.fileName }) }}</div>
  </a-menu-item>
</template>
```

languages/en_US.json

```json
{
  "TXT_CODE_NODE_INFO": "Jump to Node Page",
  // If parameters are needed, frontend code uses single curly braces
  "TXT_CODE_FILE_ERROR": "File {name} error!"
}
```

Please add this line to the language file, for example: `languages/en_US.json`

> All language texts are in `languages/*.json`, with all translations based on `en_US.json`. Therefore, if you modify any text or add any new files, `en_US.json` **must be modified and updated**, as it is the source text for all countries' languages. Other countries' languages can be automatically translated by us using AI.

If you have the `I18n Ally` plugin installed, your `$t("TXT_CODE_MY_ERROR")` should display the corresponding text.

<br />

### Building Production Version

```bash
./build.bat # Windows
./build.sh  # MacOS
```

After the build is complete, you will find the production code in the `production-code` directory.

<br />

### Finally

For more content, please refer to the official documentation.

https://docs.mcsmanager.com/ops/mcsm_network.html
