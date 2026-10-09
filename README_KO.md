<div align="center">
  <a href="https://mcsmanager.com/" target="_blank">
    <img src="./frontend/src/assets/logo.png" alt="MCSManagerLogo.png" width="510px" />    
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

[English](README.md) - [简体中文](README_ZH.md) - [繁體中文](README_TW.md) - [日本語](README_JP.md) - [Deutsch](README_DE.md) - [Русский](README_RU.md) - [Spanish](README_ES.md) - [Thai](README_TH.md) - [Français](README_FR.md) - [Português BR](README_PTBR.md) - [한국어](README_KO.md)

</div>

<br />

## MCSManager란 무엇인가요?

**MCSManager Panel** (**MCSM Panel**)은 **`Minecraft`**, **`Steam`** 및 기타 게임 서버를 위한 빠르고 배포가 쉬우며 분산형, 다중 사용자 지원, 모던 웹 기반 관리 패널입니다.

MCSManager는 **`Minecraft`** 및 **`Steam`** 게이밍 커뮤니티에서 큰 인기를 얻고 있습니다. 단일 플랫폼에서 여러 물리 또는 가상 서버를 관리할 수 있으며, **안전하고**, **신뢰할 수 있으며**, **세분화된 다중 사용자 권한 시스템**을 제공합니다. MCSM 패널은 서버 관리자, 운영자, 독립 개발자들을 지속적으로 지원하여 **`Minecraft`**, **`Terraria`** 및 기타 **`Steam`** 기반 게임 서버를 관리할 수 있도록 돕습니다.

**핵심 기능:**

1. 관리자는 다양한 템플릿(또는 Docker 이미지)을 기반으로 마인크래프트, 스팀 및 기타 게임 서버(또는 기타 프로그램)를 생성할 수 있습니다. 서버는 Docker 컨테이너 내부에서 실행되거나 프로세스로 직접 실행될 수 있으며, 웹 페이지를 통해 터미널에 접근할 수 있습니다.

2. 관리자는 일반 사용자를 생성하고 인스턴스를 할당할 수 있습니다. Docker 컨테이너 및 파일 권한 검사 등 다양한 수단을 통해 제어판은 일반 사용자가 자신에게 할당된 인스턴스에만 접근할 수 있도록 보장하여 호스트 시스템을 최대한 안전하게 유지합니다.

MCSManager는 개인 서버 호스팅 및 **IDC 서비스 제공업체**의 판매 등 **상업적 애플리케이션**의 요구 사항도 고려했습니다. 이미 여러 중소기업에서 이 패널을 **서버 관리**와 **판매 플랫폼**을 결합한 형태로 사용하고 있습니다. 또한 **다국어 환경**을 지원하여 서로 다른 국가와 지역의 사용자들이 쉽게 접근할 수 있습니다.

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="1915" height="1386" alt="market" src="https://github.com/user-attachments/assets/fc276180-a826-476a-803e-a038f97115fc" />

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<br />

## 기능

1. 내장된 애플리케이션 마켓플레이스를 통한 **`Minecraft`** 또는 **`Steam`** 게임 서버 원클릭 배포.
2. **`Palworld`**, **`Squad`**, **`Project Zomboid`**, **`Terraria`** 등을 포함한 대부분의 **`Steam`** 기반 게임 서버와 호환.
3. 드래그 앤 드롭 카드 레이아웃으로 이상적인 대시보드를 구성할 수 있는 맞춤형 웹 인터페이스.
4. 내장된 다중 사용자 액세스 및 상업용 인스턴스 호스팅 서비스 지원을 포함하는 전체 **Docker Hub** 이미지 지원.
5. 단일 웹 패널에서 여러 머신을 관리하는 분산 아키텍처.
6. TypeScript만으로 개발 및 유지 관리할 수 있는 가벼운 기술 스택.
7. ...그 외 다양한 기능.

<br />

## 런타임 환경

제어판은 **`Windows`** 및 **`Linux`** 플랫폼 모두에서 실행됩니다. 별도의 데이터베이스 설치가 필요하지 않습니다. **`Node.js`** 런타임과 몇 가지 기본 **압축 해제 유틸리티**만 설치하면 됩니다.

> **[Node.js 16.20.2](https://nodejs.org/en)** 이상이 필요합니다.
> 최적의 호환성과 안정성을 위해 **최신 LTS 버전** 사용을 권장합니다.

<br />

## 공식 문서

영어: https://docs.mcsmanager.com/

중국어: https://docs.mcsmanager.com/zh_cn/

<br />

## 설치 방법

### Windows

**Windows 시스템의 경우, 바로 실행 가능한 통합 버전으로 제공됩니다. 다운로드 후 즉시 실행할 수 있습니다.**

아카이브: https://download.mcsmanager.com/mcsmanager_windows_release.zip

`start.bat`을 더블 클릭하여 웹 패널과 데몬 프로세스를 모두 실행하세요.

<br />

### Linux

**One-line command quick installation**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**한 줄 명령어 빠른 설치**

```bash
systemctl start mcsm-{web,daemon} # 패널 시작
systemctl stop mcsm-{web,daemon}  # 패널 중지
```

- 이 스크립트는 Ubuntu/CentOS/Debian/Arch Linux에서만 작동합니다.
- 패널 코드와 런타임 환경은 `/opt/mcsmanager/` 디렉토리에 자동으로 설치됩니다.

<br />

**Linux 수동 설치**

- 원클릭 설치 방법이 작동하지 않는 경우, 아래 단계를 따라 MCSManager를 수동으로 설치할 수 있습니다:

```bash
# Step 1: 설치 디렉토리로 이동 (존재하지 않는 경우 생성)
cd /opt/

# Step 2: (선택 사항) Node.js가 설치되어 있지 않은 경우 다운로드 및 설치
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
tar -xvf node-v20.11.0-linux-x64.tar.xz

# Node.js 및 npm을 시스템 경로에 연결
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Step 3: MCSManager 설치 디렉토리 준비
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Step 4: 최신 MCSManager 릴리스 다운로드
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Step 5: 의존성 설치
chmod 775 install.sh
./install.sh

# Step 6: 두 개의 터미널 창을 열거나 screen/tmux 사용

# 첫 번째 터미널: 데몬 시작
./start-daemon.sh

# 두 번째 터미널: 웹 서비스 시작
./start-web.sh

# 7단계: 브라우저에서 패널 접속
# <public IP>를 실제 서버 IP 주소로 교체하세요.
http://<public IP>:23333/

# 웹 인터페이스는 대부분의 경우 로컬 데몬을 자동으로 감지하고 연결합니다.
```

> 위 단계에서는 패널을 시스템 서비스로 등록하지 **않습니다**.
> 백그라운드에서 계속 실행 상태를 유지하려면 **`screen`**이나 **`tmux`** 같은 도구를 사용해야 합니다.

MCSManager를 시스템 서비스로 실행하려면 공식 문서의 설정 지침을 참조하세요.

<br />

### Mac OS

```bash
# Step 1: Node.js 설치 (이미 설치된 경우 건너뜀)
# 최신 LTS 버전 사용을 권장합니다.
brew install node
node -v
npm -v

# Step 2: curl을 사용하여 최신 릴리스 다운로드
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# Step 3: 다운로드한 아카이브 압축 해제
tar -zxf mcsmanager_linux_release.tar.gz

# Step 4: 압축이 해제된 디렉토리로 이동
cd mcsmanager

# Step 5: 설치 프로그램에 실행 권한을 부여하고 실행
chmod 775 install.sh
./install.sh

# Step 6: 두 개의 터미널 창을 열거나 screen/tmux를 사용하여 서비스를 병렬로 실행

# 첫 번째 터미널: 데몬 시작
./start-daemon.sh

# 두 번째 터미널: 웹 서비스 시작
./start-web.sh

# 패널 접속 주소: http://localhost:23333/
# 웹 인터페이스는 일반적으로 로컬 데몬을 자동으로 감지하고 연결합니다.
```

<br />

### Docker Installation

`docker-compose.yml`을 사용하여 패널을 설치합니다. 내부의 모든 `<CHANGE_ME_TO_INSTALL_PATH>`를 실제 설치 디렉토리 경로로 수정해야 합니다.

```yml
services:
  web:
    image: githubyumao/mcsmanager-web:latest
    ports:
      - "23333:23333"
    volumes:
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
      - <CHANGE_ME_TO_INSTALL_PATH>/web/data:/opt/mcsmanager/web/data
      - <CHANGE_ME_TO_INSTALL_PATH>/web/logs:/opt/mcsmanager/web/logs
      - <CHANGE_ME_TO_INSTALL_PATH>/web/public/upload_files:/opt/mcsmanager/web/public/upload_files

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

참고 (Linux의 Rootless Docker): 데몬은 `DOCKER_HOST`를 지원합니다. Docker 데몬이 루트리스(Rootless) 모드로 실행되는 경우 소켓은 `/var/run/docker.sock` 대신 대개 `/run/user/<uid>/docker.sock`에 위치합니다. 이 경우 기본 소켓 마운트를 루트리스 소켓으로 교체하고 `DOCKER_HOST`를 설정하세요. 예시:

```yml
daemon:
  environment:
    - DOCKER_HOST=unix:///run/user/1000/docker.sock
  volumes:
    - /run/user/1000/docker.sock:/run/user/1000/docker.sock
```

`1000`을 실제 UID(`id -u`)로 변경하세요.

Docker Compose를 사용하여 활성화합니다.

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # 위 내용의 docker-compose.yml 작성
docker compose pull && docker compose up -d
```

참고: Docker로 설치한 후에는 웹 측에서 데몬에 자동으로 연결하지 못할 수 있습니다.

이 시점에서 패널에 들어가면 웹 측이 데몬 측과 성공적으로 연결되지 않아 일부 오류가 표시될 수 있습니다. 이 경우 새 노드를 생성하여 두 측을 연결해야 합니다.

<br />

## 코드 기여하기

이 프로젝트에 코드를 기여하기 전에 다음 사항을 반드시 확인해 주세요:

- **필수 확인:** [Issue #599 – 기여 가이드라인](https://github.com/MCSManager/MCSManager/issues/599)
- 기존 코드 구조와 형식을 유지해 주세요. **불필요하거나 과도한 서식 변경은 지양해 주세요.**
- 제출되는 모든 코드는 **국제화(i18n) 표준을 준수**해야 합니다.

### 버그 신고

모든 버그 신고와 피드백을 환영합니다. 여러분의 기여는 프로젝트를 개선하는 데 큰 도움이 됩니다.

문제가 발생한 경우 [GitHub Issues](https://github.com/MCSManager/MCSManager/issues) 페이지를 통해 신고해 주시면 가능한 빨리 처리해 드리겠습니다.

공개적으로 공개해서는 안 되는 심각한 **보안 취약점**의 경우 다음 주소로 직접 문의해 주세요: **support@mcsmanager.com**

문제가 해결되면 관련 코드나 릴리스 노트에 발견자를 명시해 드립니다.

### 감사의 말

MCSManager의 보안 테스트에 중요한 기여를 해주신 다음 개발자분들께 감사드립니다!

> [@Cuo256](https://github.com/Cuo256), [@xiaosu](https://github.com/xiaosuawa), [@tianjiefeifei](https://github.com/tianjiefeifei), [9Bakabaka](https://github.com/9Bakabaka), [Yudai Shibata](https://github.com/yudai-shibata)

<br />

## Development

### 프로젝트 구조

프로젝트는 세 가지 핵심 모듈로 구성됩니다:

- Daemon backend (`daemon` directory)
- Web backend (`panel` directory)
- Web frontend (`frontend` directory)

**웹 백엔드 역할:**

- 사용자 관리 
- 노드 연결성 
- 인증 및 권한 부여 
- API 서비스

**데몬 백엔드 역할:**

- 서버 인스턴스용 프로세스 관리 
- Docker 컨테이너 작업 
- 파일 시스템 관리 
- 실시간 터미널 접근

**웹 프론트엔드 역할:**

- 사용자 인터페이스 구현 
- 웹 백엔드 통합
- 최적화된 성능을 위한 직접 노드 통신

### 개발 환경 설정

참조: [DEVELOPMENT.md](https://www.google.com/search?q=./DEVELOPMENT.md)

<br />

## 브라우저 호환성

MCSManager는 다음을 포함한 모든 주요 최신 브라우저를 지원합니다:

- `Chrome`
- `Firefox`
- `Safari`
- `Opera`

**Internet Explorer (IE)**는 더 이상 지원되지 않습니다.

<br />

## Contributors

<a href="https://openomy.com/MCSManager/MCSManager" target="_blank" style="display: block; width: 100%;" align="center">
  <img src="https://openomy.com/svg?repo=MCSManager/MCSManager&chart=bubble&latestMonth=12" target="_blank" alt="Contribution Leaderboard" style="display: block; width: 100%;" />
</a>

## License

이 프로젝트는 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)에 따라 라이선스가 부여됩니다.

&copy; 2025 MCSManager. All rights reserved.
