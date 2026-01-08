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

## これは何ですか？

**MCSManager Panel**（略称：MCSM Panel）は、Minecraft と Steam ゲームサーバー用の高速デプロイ、分散アーキテクチャ対応、マルチユーザー、シンプルでモダンな Web 管理パネルです。

MCSManager は `Minecraft` と `Steam` ゲーミングコミュニティ内で人気を博しています。複数の物理サーバーを一元管理し、任意のホストでゲームサーバーを作成できるよう支援し、複数のサーバーを簡単に管理できる安全で信頼性の高いマルチユーザー権限システムを提供します。`Minecraft`、`Terraria`、`Steam` ゲームサーバーの管理者、運用担当者、個人開発者に健全なソフトウェアサポートを提供し続けています。

また、IDC サービスプロバイダーのプライベートサーバー販売などの商業活動にも適しています。いくつかの中小企業がすでにこのパネルを管理・販売ソフトウェアとして使用しており、**複数国の**言語をサポートしています。

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## 機能

1. アプリケーションマーケットを使用して、`Minecraft` または `Steam` ゲームサーバーをワンクリックで簡単にデプロイできます。
2. `Palworld`、`Squad`、`Project Zomboid`、`Terraria` など、ほとんどの `Steam` ゲームサーバーと互換性があります。
3. Web インターフェースはドラッグアンドドロップカードレイアウトをサポートし、お好みのインターフェースレイアウトを作成できます。
4. `Docker Hub` のすべてのイメージをサポートし、マルチユーザー、商業インスタンス販売サービスをサポートします。
5. 分散アーキテクチャをサポートし、1 つの Web インターフェースで複数のマシンを同時に管理できます。
6. シンプルな技術スタック、TypeScript に精通するだけで MCSManager 全体の開発を完了できます！
7. その他...

<br />

## 実行環境

コントロールパネルは `Windows` と `Linux` プラットフォームで実行でき、データベースのインストールは不要で、`Node.js` 環境といくつかの**解凍用コマンド**をインストールするだけで済みます。

[Node.js 16.20.2](https://nodejs.org/en) 以上を使用する必要があり、最新の LTS バージョンの使用を推奨します。

<br />

## 公式ドキュメント

英語：https://docs.mcsmanager.com/

中国語：https://docs.mcsmanager.com/zh_cn/

<br />

## インストール

### Windows

**Windows システムの場合、すぐに実行できる統合バージョンとして提供されます - ダウンロードしてすぐに実行してください：**

アーカイブ：https://download.mcsmanager.com/mcsmanager_windows_release.zip

`start.bat` をダブルクリックして、Web パネルと daemon プロセスの両方を起動します。

<br />

### Linux

**ワンラインコマンドクイックインストール**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**インストール後の使用方法**

```bash
systemctl start mcsm-{web,daemon} # パネルを開始
systemctl stop mcsm-{web,daemon}  # パネルを停止
```

- スクリプトは Ubuntu/Centos/Debian/Archlinux にのみ適用されます
- パネルコードと実行環境は `/opt/mcsmanager/` ディレクトリに自動インストールされます

<br />

**Linux 手動インストール**

- ワンクリックインストールが機能しない場合は、この手順で手動インストールを試すことができます。

```bash
# インストールディレクトリに切り替え。存在しない場合は、まず 'mkdir /opt/' で作成してください。
cd /opt/
# 実行環境（Node.js）をダウンロード。すでに Node.js 16+ がインストールされている場合は、この手順をスキップしてください。
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# アーカイブを解凍
tar -xvf node-v20.11.0-linux-x64.tar.xz
# プログラムをシステム環境変数に追加。
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# インストールディレクトリを準備。
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# MCSManager をダウンロード。
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# 依存関係をインストール。
chmod 775 install.sh
./install.sh

# 2つのターミナルまたは screen を開いてください。

# まず node プログラムを開始。
./start-daemon.sh

# Web サービスを開始（2番目のターミナルまたは screen で）。
./start-web.sh

# http://<パブリック IP>:23333/ にアクセスしてパネルを表示。
# 通常、Web アプリケーションは自動的にスキャンしてローカルデーモンに接続します。
```

このインストール方法では、パネルがシステムサービスに自動登録されないため、`screen` ソフトウェアを使用して管理する必要があります。システムサービスに MCSManager を管理させたい場合は、ドキュメントを参照してください。

<br />

### Mac OS

```bash

# まず Node.js をインストール。すでにインストールされている場合は、この手順をスキップできます。
# Node.js は最新の LTS バージョンのインストールを推奨します。
brew install node
node -v
npm -v

# curl を使用してファイルをダウンロード
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# ファイルを解凍（元のコマンドと同じ）
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# 依存関係をインストール。
chmod 775 install.sh
./install.sh

# 2つのターミナルまたは screen を開いてください。

# まず node プログラムを開始。
./start-daemon.sh

# Web サービスを開始（2番目のターミナルまたは screen で）。
./start-web.sh

# http://localhost:23333/ にアクセスしてパネルを表示。
# 通常、Web アプリケーションは自動的にスキャンしてローカルデーモンに接続します。
```

<br />

### Docker 経由でのインストール

docker-compose.yml を使用してパネルをインストールしてください、`<CHANGE_ME_TO_INSTALL_PATH>` すべてを実際のインストールパスに変更する必要があることに注意してください。

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
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
      - <CHANGE_ME_TO_INSTALL_PATH>/daemon/data:/opt/mcsmanager/daemon/data
      - <CHANGE_ME_TO_INSTALL_PATH>/daemon/logs:/opt/mcsmanager/daemon/logs
      - /var/run/docker.sock:/var/run/docker.sock
```

docker-compose を使用して有効化。

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # 上記の docker-compose.yml の内容をここに記述
docker compose pull && docker compose up -d
```

注意：Docker インストール後、Web 側は Daemon に自動的に接続できなくなる可能性があります。

この時点でパネルに入ると、一部のエラーが表示されるはずです。これは Web 側が daemon 側に正常に接続できなかったためです、それらを接続するために新しいノードを作成する必要があります。

<br />

## コードの貢献

- コードを貢献する前に必ずお読みください：https://github.com/MCSManager/MCSManager/issues/599

- コードは既存の形式を維持する必要があり、過度のコードフォーマットは許可されません。

- すべてのコードは国際化標準に準拠する必要があります。

<br />

## 開発

**このセクションは開発者向けです。**MCSManager で二次開発を行ったり、コード貢献を提出したりする場合は、これらの内容を注意深くお読みください：

### 必要要件

MCSManager の開発には `Visual Studio Code` を使用しています。以下のプラグインを**必ずインストール**してください：

- i18n テキスト表示サポート（I18n Ally）
- コードフォーマット（Prettier）
- Vue - Official
- ESLint

### 依存ファイル

`daemon/lib` ディレクトリ（存在しない場合は手動で作成）に、お使いのシステムに適したバイナリファイルを保存するために、[PTY](https://github.com/MCSManager/PTY) と [Zip-Tools](https://github.com/MCSManager/Zip-Tools) プロジェクトにアクセスしてダウンロードする必要があります。これにより `シミュレーション端末` と `ファイル解凍` の正常な動作が保証されます。

3つの依存ファイルをダウンロードし、システムアーキテクチャに応じて選択し、Releases を確認してシステムとアーキテクチャに適したバイナリファイルを見つけてください。

例:

```bash
cd /opt/mcsmanager/daemon
mkdir lib && cd lib

# シミュレーション端末依存ライブラリ
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64

# 解凍 & 圧縮ファイル依存ライブラリ
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# 7z アーカイブサポート、オプションのダウンロード
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64
```

### 実行

```bash
git clone https://github.com/MCSManager/MCSManager.git

# MacOS
./install-dependents.sh
./npm-dev-macos.sh

# Windows
./install-dependents.bat
./npm-dev-windows.bat
```

### コードの国際化

プロジェクトは複数言語に対応しているため、コード内のすべての `文字列` と `コメント` は英語のみを受け付けます。コード内で非英語テキストを直接ハードコードしないでください。

例えば、複数言語に対応する必要がある新しい文字列を書く場合があります。

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Check Name Failed!" // これはしないでください！
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // 正しい方法！
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

この行を言語ファイルに追加してください。例：`languages/en_US.json`

その中で、`en_US.json` は必須で追加する必要があり、これはすべての国言語のソーステキストです。他の国言語は AI を使用して自動翻訳できます。

```json
{
  //...
  "TXT_CODE_MY_ERROR": "Check Name Failed!",
  "TXT_CODE_NODE_INFO": "Jump to Node Page"
}
```

`I18n Ally` プラグインをインストールしている場合、`$t("TXT_CODE_MY_ERROR")` は英語テキストを表示するはずです。

翻訳テキストにパラメータを含める必要がある場合は、少し複雑になる可能性があります。フロントエンドとバックエンドで異なる i18n ライブラリを使用しているため、形式が異なる場合があります。類似のコードを見つけるためにファイルを調べる必要があります。

すべての翻訳テキストキーは重複できませんので、より長い名前を使用してください！

<br />

### 本番環境バージョンのビルド

```bash
./build.bat # Windows
./build.sh  # MacOS
```

ビルドが完了すると、`production-code` ディレクトリに本番環境コードが見つかります。

<br />

## ブラウザ互換性

- `Chrome` `Firefox` `Safari` `Opera` などのモダンな主流ブラウザをサポートします。
- `IE` ブラウザのサポートを放棄しました。

<br />

## バグレポート

発見された問題の報告を歓迎します。迅速に修正いたします。

公開するのに不便な重大なセキュリティ脆弱性を発見した場合は、support@mcsmanager.com にメールをお送りください。セキュリティ問題が修正された後、発見者の名前がコードに添付されます。

<br />

## ライセンス

ソースコードは [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) ライセンスに従います。

Copyright ©2025 MCSManager.
