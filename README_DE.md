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

## Was ist das?

**MCSManager Panel** (abgekürzt: MCSM Panel) ist ein schnell bereitstellbares, verteilte Architektur unterstützendes, mehrbenutzerfähiges, einfaches und modernes Web-Verwaltungspanel für Minecraft- und Steam-Spielserver.

MCSManager hat in den `Minecraft`- und `Steam`-Gaming-Communities an Popularität gewonnen. Es hilft Ihnen dabei, mehrere physische Server zentral zu verwalten, ermöglicht es Ihnen, Spielserver auf jedem Host zu erstellen, und bietet ein sicheres und zuverlässiges Mehrbenutzer-Berechtigungssystem, das Ihnen einfach bei der Verwaltung mehrerer Server helfen kann. Es bietet bereits gesunde Software-Unterstützung für Administratoren, Betriebspersonal und einzelne Entwickler von `Minecraft`-, `Terraria`- und `Steam`-Spielservern.

Es eignet sich auch für alle kommerziellen Aktivitäten, wie z.B. IDC-Dienstanbieter für den Verkauf privater Server. Mehrere kleine und mittlere Unternehmen verwenden dieses Panel bereits als Management- und Verkaufssoftware, und es unterstützt **mehrere Länder**-Sprachen.

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## Funktionen

1. Verwenden Sie den Anwendungsmarkt, um `Minecraft`- oder `Steam`-Spielserver mit einem Klick einfach bereitzustellen.
2. Kompatibel mit den meisten `Steam`-Spielservern wie `Palworld`, `Squad`, `Project Zomboid` und `Terraria` usw.
3. Web-Interface unterstützt Drag-and-Drop-Kartenlayout, um Ihr bevorzugtes Interface-Layout zu erstellen.
4. Unterstützt alle Images auf `Docker Hub`, unterstützt Mehrbenutzer, unterstützt kommerzielle Instanz-Verkaufsdienste.
5. Unterstützt verteilte Architektur, eine Web-Oberfläche kann mehrere Maschinen gleichzeitig verwalten.
6. Einfache Technologie-Stack, Sie müssen nur TypeScript beherrschen, um die gesamte MCSManager-Entwicklung abzuschließen!
7. Mehr...

<br />

## Laufzeitumgebung

Das Kontrollpanel kann auf `Windows`- und `Linux`-Plattformen laufen, keine Datenbankinstallation erforderlich, Sie müssen nur die `Node.js`-Umgebung und mehrere **Entpackungsbefehle** installieren.

Sie müssen [Node.js 16.20.2](https://nodejs.org/en) oder höher verwenden, empfehlen wir die Verwendung der neuesten LTS-Version.

<br />

## Offizielle Dokumentation

Englisch: https://docs.mcsmanager.com/

Chinesisch: https://docs.mcsmanager.com/zh_cn/

<br />

## Installation

### Windows

**Für Windows-Systeme wird es als integrierte Version bereitgestellt, die sofort ausgeführt werden kann - herunterladen und sofort ausführen:**

Archiv: https://download.mcsmanager.com/mcsmanager_windows_release.zip

Doppelklicken Sie auf `start.bat`, um sowohl das Web-Panel als auch den Daemon-Prozess zu starten.

<br />

### Linux

**Einzeiliger Befehl für schnelle Installation**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**Verwendung nach der Installation**

```bash
systemctl start mcsm-{web,daemon} # Panel starten
systemctl stop mcsm-{web,daemon}  # Panel stoppen
```

- Skript gilt nur für Ubuntu/Centos/Debian/Archlinux
- Panel-Code und Laufzeitumgebung werden automatisch im `/opt/mcsmanager/` Verzeichnis installiert.

<br />

**Linux manuelle Installation**

- Wenn die Ein-Klick-Installation nicht funktioniert, können Sie diesen Schritt für die manuelle Installation versuchen.

```bash
# Zum Installationsverzeichnis wechseln. Wenn es nicht existiert, erstellen Sie es bitte mit 'mkdir /opt/' zuerst.
cd /opt/
# Laufzeitumgebung (Node.js) herunterladen. Wenn Sie bereits Node.js 16+ installiert haben, ignorieren Sie bitte diesen Schritt.
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# Archiv entpacken
tar -xvf node-v20.11.0-linux-x64.tar.xz
# Programm zu System-Umgebungsvariablen hinzufügen.
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Installationsverzeichnis vorbereiten.
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# MCSManager herunterladen.
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Abhängigkeiten installieren.
chmod 775 install.sh
./install.sh

# Bitte öffnen Sie zwei Terminals oder screen.

# Zuerst node-Programm starten.
./start-daemon.sh

# Web-Service starten (im zweiten Terminal oder screen).
./start-web.sh

# Besuchen Sie http://<öffentliche IP>:23333/ um das Panel anzuzeigen.
# Im Allgemeinen wird die Web-Anwendung automatisch scannen und sich mit dem lokalen Daemon verbinden.
```

Diese Installationsmethode registriert das Panel nicht automatisch beim Systemdienst, daher müssen Sie `screen`-Software verwenden, um es zu verwalten. Wenn Sie möchten, dass der Systemdienst MCSManager übernimmt, lesen Sie bitte die Dokumentation.

<br />

### Mac OS

```bash

# Zuerst Node.js installieren, wenn Sie es bereits installiert haben, können Sie diesen Schritt überspringen.
# Node.js empfiehlt die Installation der neuesten LTS-Version.
brew install node
node -v
npm -v

# Verwenden Sie curl zum Herunterladen von Dateien
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# Dateien entpacken (gleicher Befehl wie ursprünglich)
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# Abhängigkeiten installieren.
chmod 775 install.sh
./install.sh

# Bitte öffnen Sie zwei Terminals oder screen.

# Zuerst node-Programm starten.
./start-daemon.sh

# Web-Service starten (im zweiten Terminal oder screen).
./start-web.sh

# Besuchen Sie http://localhost:23333/ um das Panel anzuzeigen.
# Im Allgemeinen wird die Web-Anwendung automatisch scannen und sich mit dem lokalen Daemon verbinden.
```

<br />

### Installation über Docker

Installieren Sie das Panel mit docker-compose.yml, beachten Sie, dass Sie alle `<CHANGE_ME_TO_INSTALL_PATH>` zu Ihrem tatsächlichen Installationspfad ändern müssen.

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

Mit docker-compose aktivieren.

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # Schreiben Sie den Inhalt der docker-compose.yml oben hier
docker compose pull && docker compose up -d
```

Hinweis: Nach der Docker-Installation kann die Web-Seite möglicherweise nicht mehr automatisch mit dem Daemon verbinden.

Zu diesem Zeitpunkt, wenn Sie das Panel betreten, sollten Sie einige Fehler sehen, weil die Web-Seite nicht erfolgreich mit der Daemon-Seite verbunden werden konnte, Sie müssen einen neuen Knoten erstellen, um sie zu verbinden.

<br />

## Code-Beiträge

- Muss vor Code-Beiträgen gelesen werden: https://github.com/MCSManager/MCSManager/issues/599

- Code muss das bestehende Format beibehalten, übermäßige Code-Formatierung ist nicht erlaubt.

- Alle Codes müssen den Internationalisierungsstandards entsprechen.

<br />

## Entwicklung

**Dieser Abschnitt ist für Entwickler.** Wenn Sie Sekundärentwicklung an MCSManager durchführen oder Code-Beiträge einreichen möchten, lesen Sie bitte diese Inhalte sorgfältig:

### Erforderlich

Wir verwenden `Visual Studio Code` zur Entwicklung von MCSManager. Sie müssen diese Plugins **installieren**:

- i18n-Textanzeige-Unterstützung (I18n Ally)
- Code-Formatierung (Prettier)
- Vue - Official
- ESLint

### Abhängigkeitsdateien

Sie müssen zu den [PTY](https://github.com/MCSManager/PTY) und [Zip-Tools](https://github.com/MCSManager/Zip-Tools) Projekten gehen, um für Ihr System geeignete Binärdateien herunterzuladen und sie im `daemon/lib` Verzeichnis zu speichern (manuell erstellen, falls es nicht existiert), um den normalen Betrieb von `Simulationsterminal` und `Dateientpackung` zu gewährleisten.

Laden Sie drei Abhängigkeitsdateien herunter, wählen Sie entsprechend Ihrer Systemarchitektur aus, und überprüfen Sie die Releases, um Binärdateien zu finden, die zu Ihrem System und Ihrer Architektur passen.

Zum Beispiel:

```bash
cd /opt/mcsmanager/daemon
mkdir lib && cd lib

# Simulations-Terminal-Abhängigkeitsbibliothek
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64

# Bibliothek für Entpacken & Komprimieren von Dateien
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# 7z-Archiv-Unterstützung, optionaler Download
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64
```

### Ausführung

```bash
git clone https://github.com/MCSManager/MCSManager.git

# MacOS
./install-dependents.sh
./npm-dev-macos.sh

# Windows
./install-dependents.bat
./npm-dev-windows.bat
```

### Code-Internationalisierung

Da das Projekt mehrere Sprachen unterstützt, akzeptiert der Code nur Englisch für alle `Strings` und `Kommentare`, bitte kodieren Sie keine nicht-englischen Texte direkt im Code.

Zum Beispiel könnten Sie eine neue Zeichenkette schreiben, die mehrere Sprachen unterstützen muss.

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Check Name Failed!" // Tun Sie das nicht!
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // Richtig!
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

Bitte fügen Sie diese Zeile zur Sprachdatei hinzu, zum Beispiel: `languages/en_US.json`

Dabei ist `en_US.json` obligatorisch hinzuzufügen, es ist der Quelltext für alle Ländersprachen, andere Ländersprachen können von uns mit KI automatisch übersetzt werden.

```json
{
  //...
  "TXT_CODE_MY_ERROR": "Check Name Failed!",
  "TXT_CODE_NODE_INFO": "Jump to Node Page"
}
```

Wenn Sie das `I18n Ally` Plugin installiert haben, sollte Ihr `$t("TXT_CODE_MY_ERROR")` den englischen Text anzeigen.

Wenn der Übersetzungstext Parameter tragen muss, könnte das etwas komplex werden, da Frontend und Backend verschiedene i18n-Bibliotheken verwenden, daher könnte das Format unterschiedlich sein. Sie müssen durch die Dateien schauen, um ähnliche Codes zu finden und zu verstehen.

Alle Übersetzungstextschlüssel können nicht dupliziert werden, bitte verwenden Sie einen längeren Namen!

<br />

### Produktionsumgebungsversion erstellen

```bash
./build.bat # Windows
./build.sh  # MacOS
```

Nach dem Erstellen finden Sie den Produktionsumgebungscode im `production-code` Verzeichnis.

<br />

## Browser-Kompatibilität

- Unterstützt moderne Mainstream-Browser wie `Chrome` `Firefox` `Safari` `Opera`.
- Hat die Unterstützung für `IE`-Browser aufgegeben.

<br />

## Fehlerberichte

Willkommen zur Meldung aller gefundenen Probleme, wir werden sie schnell beheben.

Wenn Sie schwerwiegende Sicherheitslücken entdecken, die öffentlich nicht veröffentlicht werden können, senden Sie bitte eine E-Mail an: support@mcsmanager.com. Nach der Behebung von Sicherheitsproblemen wird der Name des Entdeckers im Code angehängt.

<br />

## Lizenz

Der Quellcode folgt der [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) Lizenz.

Copyright ©2025 MCSManager.
