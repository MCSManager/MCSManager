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

## O que é isso?

**MCSManager Panel** (abreviado: MCSM Panel) é um painel de administração web moderno, simples, multi-usuário, compatível com arquitetura distribuída e de implantação rápida para servidores de jogos Minecraft e Steam.

MCSManager ganhou popularidade nas comunidades de jogos `Minecraft` e `Steam`. Ajuda você a gerenciar centralmente múltiplos servidores físicos, permitindo criar servidores de jogos em qualquer host, e fornece um sistema de permissões multi-usuário seguro e confiável que pode facilmente ajudá-lo a gerenciar múltiplos servidores. Tem fornecido suporte de software saudável para administradores, pessoal de operações e desenvolvedores individuais de servidores de jogos `Minecraft`, `Terraria` e `Steam`.

Também é adequado para qualquer atividade comercial, como provedores de serviços IDC para venda de servidores privados, etc. Várias pequenas e médias empresas já estão usando este painel como software de gerenciamento e vendas, e suporta idiomas de **múltiplos países**.

<img width="3164" height="2060" alt="1" src="https://github.com/user-attachments/assets/570d2447-66dc-4c0b-b2d2-4c3176b51d67" />

<img width="1871" height="1342" alt="terminal" src="https://github.com/user-attachments/assets/7f6ed988-e402-4347-94ee-a0469f6658da" />

<img width="3164" height="2060" alt="3" src="https://github.com/user-attachments/assets/2722cf9f-de9b-4630-b0ea-c00283791d8d" />

<img width="3164" height="2060" alt="4" src="https://github.com/user-attachments/assets/c7a3165c-466b-42c5-b75a-16ada603b1da" />

<br />

## Recursos

1. Use o mercado de aplicativos para implantar facilmente servidores de jogos `Minecraft` ou `Steam` com um clique.
2. Compatível com a maioria dos servidores de jogos `Steam`, como `Palworld`, `Squad`, `Project Zomboid` e `Terraria`, etc.
3. Interface web suporta layout de cartões de arrastar e soltar para criar seu layout de interface preferido.
4. Suporta todas as imagens no `Docker Hub`, suporta multi-usuário, suporta serviços de venda de instâncias comerciais.
5. Suporta arquitetura distribuída, uma interface web pode gerenciar múltiplas máquinas simultaneamente.
6. Stack tecnológico simples, você só precisa dominar TypeScript para completar todo o desenvolvimento do MCSManager!
7. Mais...

<br />

## Ambiente de Execução

O painel de controle pode executar em plataformas `Windows` e `Linux`, não requer instalação de banco de dados, você só precisa instalar o ambiente `Node.js` e vários **comandos de descompactação**.

Deve usar [Node.js 16.20.2](https://nodejs.org/en) ou superior, recomendamos usar a versão LTS mais recente.

<br />

## Documentação Oficial

Inglês: https://docs.mcsmanager.com/

Chinês: https://docs.mcsmanager.com/zh_cn/

<br />

## Instalação

### Windows

**Para sistemas Windows, vem como uma versão integrada pronta para executar - baixe e execute imediatamente:**

Arquivo: https://download.mcsmanager.com/mcsmanager_windows_release.zip

Clique duas vezes em `start.bat` para iniciar tanto o painel web quanto o processo daemon.

<br />

### Linux

**Comando de uma linha para instalação rápida**

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

**Uso após a instalação**

```bash
systemctl start mcsm-{web,daemon} # Iniciar painel
systemctl stop mcsm-{web,daemon}  # Parar painel
```

- Script se aplica apenas ao Ubuntu/Centos/Debian/Archlinux
- Código do painel e ambiente de execução são instalados automaticamente no diretório `/opt/mcsmanager/`.

<br />

**Instalação manual do Linux**

- Se a instalação de um clique não funcionar, você pode tentar este passo para instalação manual.

```bash
# Mudar para o diretório de instalação. Se não existir, por favor crie com 'mkdir /opt/' primeiro.
cd /opt/
# Baixar ambiente de execução (Node.js). Se você já tem Node.js 16+ instalado, por favor ignore este passo.
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
# Extrair arquivo
tar -xvf node-v20.11.0-linux-x64.tar.xz
# Adicionar programa às variáveis de ambiente do sistema.
ln -s /opt/node-v20.11.0-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm

# Preparar diretório de instalação.
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# Baixar MCSManager.
wget https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz
tar -zxf mcsmanager_linux_release.tar.gz

# Instalar dependências.
chmod 775 install.sh
./install.sh

# Por favor abra dois terminais ou screen.

# Iniciar programa node primeiro.
./start-daemon.sh

# Iniciar serviço web (no segundo terminal ou screen).
./start-web.sh

# Visite http://<IP público>:23333/ para ver o painel.
# Geralmente, a aplicação web irá automaticamente escanear e conectar ao daemon local.
```

Este método de instalação não registra automaticamente o painel aos serviços do sistema, então você deve usar software `screen` para gerenciá-lo. Se você quiser que o serviço do sistema assuma o MCSManager, por favor consulte a documentação.

<br />

### Mac OS

```bash

# Primeiro instalar Node.js, se você já tem instalado, pode pular este passo.
# Node.js recomenda instalar a versão LTS mais recente.
brew install node
node -v
npm -v

# Usar curl para baixar arquivos
curl -L https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz -o mcsmanager_linux_release.tar.gz

# Extrair arquivos (mesmo comando que o original)
tar -zxf mcsmanager_linux_release.tar.gz

cd mcsmanager

# Instalar dependências.
chmod 775 install.sh
./install.sh

# Por favor abra dois terminais ou screen.

# Iniciar programa node primeiro.
./start-daemon.sh

# Iniciar serviço web (no segundo terminal ou screen).
./start-web.sh

# Visite http://localhost:23333/ para ver o painel.
# Geralmente, a aplicação web irá automaticamente escanear e conectar ao daemon local.
```

<br />

### Instalação via Docker

Instale o painel usando docker-compose.yml, note que você precisa alterar todos os `<CHANGE_ME_TO_INSTALL_PATH>` para seu caminho de instalação real.

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

Habilitar usando docker-compose.

```bash
mkdir -p <CHANGE_ME_TO_INSTALL_PATH>
cd <CHANGE_ME_TO_INSTALL_PATH>
vim docker-compose.yml # Escreva aqui o conteúdo do docker-compose.yml acima
docker compose pull && docker compose up -d
```

Nota: Após a instalação do Docker, o lado Web pode não conseguir mais conectar automaticamente ao Daemon.

Neste momento, se você entrar no painel, deve ver alguns erros porque o lado Web não conseguiu conectar com sucesso ao lado daemon, você precisa criar um novo nó para conectá-los.

<br />

## Contribuindo com Código

- Deve ser lido antes de contribuir com código: https://github.com/MCSManager/MCSManager/issues/599

- Código precisa manter o formato existente, formatação excessiva de código não é permitida.

- Todo código deve cumprir com os padrões de internacionalização.

<br />

## Desenvolvimento

**Esta seção é para desenvolvedores.** Se você quer fazer desenvolvimento secundário no MCSManager ou enviar contribuições de código, por favor leia cuidadosamente estes conteúdos:

### Requerido

Usamos `Visual Studio Code` para desenvolver MCSManager. Você deve **instalar** estes plugins:

- Suporte de exibição de texto i18n (I18n Ally)
- Formatação de código (Prettier)
- Vue - Official
- ESLint

### Arquivos de Dependências

Você precisa ir aos projetos [PTY](https://github.com/MCSManager/PTY) e [Zip-Tools](https://github.com/MCSManager/Zip-Tools) para baixar arquivos binários adequados para seu sistema, armazená-los no diretório `daemon/lib` (criar manualmente se não existir) para garantir o funcionamento normal de `terminal de simulação` e `descompactação de arquivos`.

Baixe três arquivos de dependência, selecione conforme a arquitetura do seu sistema, e verifique os Releases para encontrar binários adequados para seu sistema e arquitetura.

Por exemplo:

```bash
cd /opt/mcsmanager/daemon
mkdir lib && cd lib

# Biblioteca de dependências do terminal emulado
wget https://github.com/MCSManager/PTY/releases/download/latest/pty_linux_x64

# Biblioteca de dependências para extrair e comprimir arquivos
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_linux_x64

# Suporte para arquivos 7z, download opcional
wget https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_linux_x64
```

### Execução

```bash
git clone https://github.com/MCSManager/MCSManager.git

# MacOS
./install-dependents.sh
./npm-dev-macos.sh

# Windows
./install-dependents.bat
./npm-dev-windows.bat
```

### Internacionalização de Código

Como o projeto se adapta a múltiplos idiomas, todas as `strings` e `comentários` no código apenas aceitam inglês, então por favor não codifique texto não-inglês diretamente no código.

Por exemplo, você pode escrever uma nova string que precisa se adaptar a múltiplos idiomas.

```ts
import { $t } from "../i18n";

if (!checkName) {
  const errorMsg = "Check Name Failed!" // Não faça isso!
  const errorMsg = $t("TXT_CODE_MY_ERROR"); // Correto!
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

Por favor adicione esta linha ao arquivo de idioma, por exemplo: `languages/en_US.json`

Entre eles, `en_US.json` é obrigatório adicionar, é o texto fonte para todos os idiomas de países, outros idiomas de países podem ser traduzidos automaticamente por nós usando IA.

```json
{
  //...
  "TXT_CODE_MY_ERROR": "Check Name Failed!",
  "TXT_CODE_NODE_INFO": "Jump to Node Page"
}
```

Se você instalou o plugin `I18n Ally`, seu `$t("TXT_CODE_MY_ERROR")` deve exibir o texto em inglês.

Se o texto de tradução precisa carregar parâmetros, isso pode ser um pouco complexo, porque frontend e backend usam bibliotecas i18n diferentes, então o formato pode ser diferente. Você precisa olhar através dos arquivos para encontrar código similar para entender.

Todas as chaves de texto de tradução não podem ser duplicadas, então por favor tente usar um nome mais longo!

<br />

### Construir Versão de Ambiente de Produção

```bash
./build.bat # Windows
./build.sh  # MacOS
```

Após a construção estar completa, você encontrará o código do ambiente de produção no diretório `production-code`.

<br />

## Compatibilidade do Navegador

- Suporta navegadores modernos principais como `Chrome` `Firefox` `Safari` `Opera`.
- Abandonou suporte para navegador `IE`.

<br />

## Relatórios de Bugs

Bem-vindo para reportar qualquer problema encontrado, iremos corrigi-los rapidamente.

Se você descobrir vulnerabilidades de segurança graves que são inconvenientes de publicar publicamente, por favor envie um email para: support@mcsmanager.com. Após problemas de segurança serem corrigidos, o nome do descobridor será anexado no código.

<br />

## Licença

O código fonte segue a licença [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).

Copyright ©2025 MCSManager.
