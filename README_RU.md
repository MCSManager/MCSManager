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
[日本語](README_JP.md) - [Spanish](README_ES.md) - [Thai](README_TH.md) - [Français](README_FR.md) - [Русский](README_RU.md)

</div>

<br />

## Что это?

**MCSManager Panel** (сокращенно: MCSM Panel) — это современная, простая, многопользовательская веб-панель управления с поддержкой распределенной архитектуры и быстрым развертыванием для игровых серверов Minecraft и Steam.

MCSManager завоевал популярность в сообществах игр `Minecraft` и `Steam`. Он помогает вам централизованно управлять несколькими физическими серверами, позволяет создавать игровые серверы на любом хосте и предоставляет безопасную и надежную многопользовательскую систему разрешений, которая может легко помочь вам управлять несколькими серверами. Он уже предоставляет здоровую поддержку программного обеспечения для администраторов, операционного персонала и индивидуальных разработчиков игровых серверов `Minecraft`, `Terraria` и `Steam`.

Он также подходит для любой коммерческой деятельности, такой как поставщики IDC-услуг для продажи частных серверов и т.д. Несколько малых и средних предприятий уже используют эту панель в качестве программного обеспечения для управления и продаж, и она поддерживает языки **множества стран**.

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## Функции

1. Используйте маркет приложений для легкого развертывания игровых серверов `Minecraft` или `Steam` одним кликом.
2. Совместим с большинством игровых серверов `Steam`, таких как `Palworld`, `Squad`, `Project Zomboid` и `Terraria` и т.д.
3. Веб-интерфейс поддерживает макет карточек перетаскивания для создания предпочитаемого макета интерфейса.
4. Поддерживает все образы на `Docker Hub`, поддерживает многопользовательский режим, поддерживает коммерческие услуги продажи экземпляров.
5. Поддерживает распределенную архитектуру, один веб-интерфейс может управлять несколькими машинами одновременно.
6. Простой технологический стек, вам нужно только освоить TypeScript, чтобы завершить всю разработку MCSManager!
7. И многое другое...

<br />

## Среда выполнения

Панель управления может работать на платформах `Windows` и `Linux`, не требует установки базы данных, вам нужно только установить среду `Node.js` и несколько **команд для распаковки**.

Необходимо использовать [Node.js 16.20.2](https://nodejs.org/en) или выше, рекомендуется использовать последнюю LTS-версию.

<br />

## Официальная документация

Английский: https://docs.mcsmanager.com/

Китайский: https://docs.mcsmanager.com/zh_cn/

<br />

## Установка

### Windows

**Для систем Windows поставляется как готовая к запуску интегрированная версия - скачайте и запускайте сразу:**

Архив: https://download.mcsmanager.com/mcsmanager_windows_release.zip

Дважды щелкните `start.bat`, чтобы запустить как веб-панель, так и процесс daemon.

<br />

### Linux

**Однострочная команда для быстрой установки**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**Использование после установки**

```bash
systemctl start mcsm-{web,daemon} # Запуск панели
systemctl stop mcsm-{web,daemon}  # Остановка панели
```

- Скрипт применяется только к Ubuntu/Centos/Debian/Archlinux
- Код панели и среда выполнения автоматически устанавливаются в каталог `/opt/mcsmanager/`.

<br />

**Ручная установка Linux**

- Если установка в один клик не работает, вы можете попробовать этот шаг для ручной установки.

```bash
# Перейти в каталог установки. Если он не существует, создайте его с помощью 'mkdir /opt/' сначала.
cd /opt/
# Скачать среду выполнения (Node.js). Если у вас уже установлен Node.js 16+, пожалуйста, пропустите этот шаг.
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# Распаковать архив
tar -xvf node-v20.11.0-linux-x64.tar.xz
# Добавить программу в системные переменные окружения.
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Подготовить каталог установки.
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Скачать MCSManager.
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Установить зависимости.
chmod 775 install.sh
./install.sh

# Пожалуйста, откройте два терминала или screen.

# Сначала запустить программу node.
./start-daemon.sh

# Запустить веб-сервис (во втором терминале или screen).
./start-web.sh

# Посетите http://<публичный IP>:23333/ для просмотра панели.
# Обычно веб-приложение автоматически сканирует и подключается к локальному демону.
```

Этот метод установки не регистрирует панель в системных службах автоматически, поэтому вы должны использовать программное обеспечение `screen` для управления. Если вы хотите, чтобы системная служба взяла на себя MCSManager, пожалуйста, обратитесь к документации.

<br />

### Mac OS

```bash

# Сначала установить Node.js, если у вас уже установлен, вы можете пропустить этот шаг.
# Node.js рекомендует установить последнюю LTS-версию.
brew install node
node -v
npm -v

# Использовать curl для скачивания файлов
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# Распаковать файлы (такая же команда, как оригинальная)
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# Установить зависимости.
chmod 775 install.sh
./install.sh

# Пожалуйста, откройте два терминала или screen.

# Сначала запустить программу node.
./start-daemon.sh

# Запустить веб-сервис (во втором терминале или screen).
./start-web.sh

# Посетите http://localhost:23333/ для просмотра панели.
# Обычно веб-приложение автоматически сканирует и подключается к локальному демону.
```

<br />

### Установка через Docker

Установите панель с помощью docker-compose.yml, обратите внимание, что вам нужно изменить все `<CHANGE_ME_TO_INSTALL_PATH>` на ваш фактический путь установки.

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

Включить с помощью docker-compose.

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # Напишите здесь вышеуказанное содержимое docker-compose.yml
docker compose pull && docker compose up -d
```

Примечание: После установки Docker веб-сторона может больше не подключаться к демону автоматически.

В этот момент, если вы войдете в панель, вы должны увидеть некоторые ошибки, потому что веб-сторона не смогла успешно подключиться к стороне демона, вам нужно создать новый узел, чтобы соединить их вместе.

<br />

## Вклад в код

- Должно быть прочитано перед вкладом в код: https://github.com/MCSManager/MCSManager/issues/599

- Код должен поддерживать существующий формат, чрезмерное форматирование кода не допускается.

- Весь код должен соответствовать стандартам интернационализации.

<br />

## Разработка

**Этот раздел для разработчиков.** Если вы хотите заниматься вторичной разработкой MCSManager или отправлять вклады в код, пожалуйста, внимательно прочитайте эти материалы:

### Требуется

Мы используем `Visual Studio Code` для разработки MCSManager. Вы **должны установить** эти плагины:

- Поддержка отображения текста i18n (I18n Ally)
- Форматирование кода (Prettier)
- Vue - Official
- ESLint

### Файлы зависимостей

Вам нужно перейти к проектам [PTY](https://github.com/MCSManager/PTY) и [Zip-Tools](https://github.com/MCSManager/Zip-Tools), чтобы скачать двоичные файлы, подходящие для вашей системы, сохранить их в каталоге `daemon/lib` (создать вручную, если не существует) для обеспечения нормальной работы `симуляционного терминала` и `распаковки файлов`.

Скачайте три файла зависимостей, выберите в соответствии с архитектурой вашей системы, и проверьте релизы, чтобы найти двоичные файлы, подходящие для вашей системы и архитектуры.

Например:

```bash
cd /opt/mcsmanager/daemon
mkdir lib && cd lib

# Библиотека зависимостей симуляционного терминала
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64

# Библиотека зависимостей для распаковки и сжатия файлов
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# Поддержка архивов 7z, опциональная загрузка
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64
```

### Выполнение

```bash
git clone https://github.com/MCSManager/MCSManager.git

# MacOS
./install-dependents.sh
./npm-dev-macos.sh

# Windows
./install-dependents.bat
./npm-dev-windows.bat
```

### Интернационализация кода

Поскольку проект адаптируется к нескольким языкам, все `строки` и `комментарии` в коде принимают только английский язык, поэтому, пожалуйста, не кодируйте неанглийский текст напрямую в коде.

Например, вы можете написать новую строку, которая должна адаптироваться к нескольким языкам.

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Check Name Failed!" // Не делайте так!
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // Правильно!
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

Пожалуйста, добавьте эту строку в языковой файл, например: `languages/en_US.json`

Среди них `en_US.json` обязательно добавить, это исходный текст для всех языков стран, другие языки стран могут быть автоматически переведены нами с помощью ИИ.

```json
{
  //...
  "TXT_CODE_MY_ERROR": "Check Name Failed!",
  "TXT_CODE_NODE_INFO": "Jump to Node Page"
}
```

Если вы установили плагин `I18n Ally`, ваш `$t("TXT_CODE_MY_ERROR")` должен отображать английский текст.

Если текст перевода должен нести параметры, это может быть немного сложно, поскольку frontend и backend используют разные библиотеки i18n, поэтому формат может быть разным. Вам нужно просмотреть файлы, чтобы найти похожий код для понимания.

Все ключи текста перевода не могут дублироваться, поэтому, пожалуйста, попробуйте использовать более длинное имя!

<br />

### Сборка версии производственной среды

```bash
./build.bat # Windows
./build.sh  # MacOS
```

После завершения сборки вы найдете код производственной среды в каталоге `production-code`.

<br />

## Совместимость браузера

- Поддерживает современные основные браузеры, такие как `Chrome` `Firefox` `Safari` `Opera`.
- Отказался от поддержки браузера `IE`.

<br />

## Отчеты об ошибках

Добро пожаловать для сообщения о любых найденных проблемах, мы исправим их быстро.

Если вы обнаружите серьезные уязвимости безопасности, которые неудобно публиковать публично, пожалуйста, отправьте электронное письмо по адресу: support@mcsmanager.com. После исправления проблем безопасности имя первооткрывателя будет прикреплено в коде.

<br />

## Лицензия

Исходный код следует лицензии [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).

Copyright ©2025 MCSManager.
