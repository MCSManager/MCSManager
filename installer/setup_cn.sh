#!/bin/bash
# This script file is specifically designed for the Chinese region, and servers in the Chinese region are used to accelerate file downloads.

mcsmanager_install_path="/opt/mcsmanager"
mcsmanager_download_addr="https://download.mcsmanager.com/mcsmanager_linux_release.tar.gz"
package_name="mcsmanager_linux_release.tar.gz"
node="v20.12.2"
arch=$(uname -m)

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root. Please use \"sudo bash\" instead."
  exit 1
fi

printf "\033c"

echo_cyan() {
  printf '\033[1;36m%b\033[0m\n' "$@"
}
echo_red() {
  printf '\033[1;31m%b\033[0m\n' "$@"
}
echo_green() {
  printf '\033[1;32m%b\033[0m\n' "$@"
}
echo_cyan_n() {
  printf '\033[1;36m%b\033[0m' "$@"
}
echo_yellow() {
  printf '\033[1;33m%b\033[0m\n' "$@"
}

# script info
echo_cyan "+----------------------------------------------------------------------
| MCSManager 安装脚本 (MCSManager Installer)
+----------------------------------------------------------------------
"

Red_Error() {
  echo '================================================='
  printf '\033[1;31;40m%b\033[0m\n' "$@"
  echo '================================================='
  exit 1
}

Install_Node() {
  if [[ -f "$node_install_path"/bin/node ]] && [[ "$("$node_install_path"/bin/node -v)" == "$node" ]]; then
    echo_green "Node.js version is up-to-date, skipping installation."
    return
  fi

  echo_cyan "[+] Install Node.JS environment..."

  rm -irf "$node_install_path"

  cd /opt || Red_Error "[x] Failed to enter /opt"

  rm -rf "node-$node-linux-$arch.tar.gz"

  # wget "https://nodejs.org/dist/$node/node-$node-linux-$arch.tar.gz" || Red_Error "[x] Failed to download node release"
  wget "https://registry.npmmirror.com/-/binary/node/$node/node-$node-linux-$arch.tar.gz" || Red_Error "[x] Failed to download node release"

  tar -zxf "node-$node-linux-$arch.tar.gz" || Red_Error "[x] Failed to untar node"

  rm -rf "node-$node-linux-$arch.tar.gz"

  if [[ -f "$node_install_path"/bin/node ]] && [[ "$("$node_install_path"/bin/node -v)" == "$node" ]]; then
    echo_green "Success"
  else
    Red_Error "[x] Node installation failed!"
  fi

  echo
  echo_yellow "=============== Node.JS Version ==============="
  echo_yellow " node: $("$node_install_path"/bin/node -v)"
  echo_yellow " npm: v$(env "$node_install_path"/bin/node "$node_install_path"/bin/npm -v)"
  echo_yellow "=============== Node.JS Version ==============="
  echo

  sleep 3
}

Install_MCSManager() {
  echo_cyan "[+] 安装 MCSManager..."

  # stop service
  systemctl disable --now mcsm-{web,daemon}

  # delete service
  rm -rf /etc/systemd/system/mcsm-{daemon,web}.service
  systemctl daemon-reload

  mkdir -p "${mcsmanager_install_path}" || Red_Error "[x] Failed to create ${mcsmanager_install_path}"

  # cd /opt/mcsmanager
  cd "${mcsmanager_install_path}" || Red_Error "[x] Failed to enter ${mcsmanager_install_path}"

  # download MCSManager release
  wget "${mcsmanager_download_addr}" -O "${package_name}" || Red_Error "[x] 未能成功下载 MCSManager"
  tar -zxf ${package_name} -o || Red_Error "[x] Failed to untar ${package_name}"
  rm -rf "${mcsmanager_install_path}/${package_name}"

  # compatible with tar.gz packages of different formats
  if [ -d "/opt/mcsmanager/mcsmanager" ]; then
    cp -rf /opt/mcsmanager/mcsmanager/* /opt/mcsmanager/
    rm -rf /opt/mcsmanager/mcsmanager
  fi

  # echo "[→] cd daemon"
  cd "${mcsmanager_install_path}/daemon" || Red_Error "[x] Failed to enter ${mcsmanager_install_path}/daemon"

  echo_cyan "[+] Install MCSManager-Daemon dependencies..."
  env "$node_install_path"/bin/node "$node_install_path"/bin/npm install --registry=https://registry.npmmirror.com --production --no-fund --no-audit &>/dev/null || Red_Error "[x] Failed to npm install in ${mcsmanager_install_path}/daemon"

  # echo "[←] cd .."
  cd "${mcsmanager_install_path}/web" || Red_Error "[x] Failed to enter ${mcsmanager_install_path}/web"

  echo_cyan "[+] Install MCSManager-Web dependencies..."
  env "$node_install_path"/bin/node "$node_install_path"/bin/npm install --registry=https://registry.npmmirror.com --production --no-fund --no-audit &>/dev/null || Red_Error "[x] Failed to npm install in ${mcsmanager_install_path}/web"

  echo
  echo_yellow "=============== MCSManager ==============="
  echo_green "Daemon: ${mcsmanager_install_path}/daemon"
  echo_green "Web: ${mcsmanager_install_path}/web"
  echo_yellow "=============== MCSManager ==============="
  echo
  echo_green "[+] MCSManager installation success!"

  chmod -R 755 "$mcsmanager_install_path"

  sleep 3
}

Create_Service() {
  echo_cyan "[+] 创建 MCSManager 面板服务..."

  echo "[Unit]
Description=MCSManager-Daemon

[Service]
WorkingDirectory=${mcsmanager_install_path}/daemon
ExecStart=${node_install_path}/bin/node app.js
ExecReload=/bin/kill -s QUIT \$MAINPID
ExecStop=/bin/kill -s QUIT \$MAINPID
Environment=\"PATH=${PATH}\"

[Install]
WantedBy=multi-user.target
" >/etc/systemd/system/mcsm-daemon.service

  echo "[Unit]
Description=MCSManager-Web

[Service]
WorkingDirectory=${mcsmanager_install_path}/web
ExecStart=${node_install_path}/bin/node app.js
ExecReload=/bin/kill -s QUIT \$MAINPID
ExecStop=/bin/kill -s QUIT \$MAINPID
Environment=\"PATH=${PATH}\"

[Install]
WantedBy=multi-user.target
" >/etc/systemd/system/mcsm-web.service

  systemctl daemon-reload
  systemctl enable --now mcsm-{daemon,web}.service
  echo_green "Registered!"

  sleep 2

  printf "\n\n\n\n"

  echo_yellow "=================================================================="
  echo_green "安装完成，欢迎使用 MCSManager ！"
  echo_yellow " "
  echo_cyan_n "主控网页访问地址:        "
  echo_yellow "http://<Your IP>:23333  (Browser)"
  echo_cyan_n "被控守护进程地址:          "
  echo_yellow "ws://<Your IP>:24444    (Cluster)"
  echo_red "默认情况下，你必须在防火墙放行 23333 和 24444 端口才能确保面板工作正常！"
  echo_yellow " "
  echo_cyan "面板开关指令:"
  echo_cyan "systemctl start mcsm-{daemon,web}.service"
  echo_cyan "systemctl stop mcsm-{daemon,web}.service"
  echo_cyan "systemctl restart mcsm-{daemon,web}.service"
  echo_yellow " "
  echo_green "官方文档: https://docs.mcsmanager.com/"
  echo_yellow "=================================================================="
}

# Environmental inspection
if [[ "$arch" == x86_64 ]]; then
  arch=x64
  #echo "[-] x64 architecture detected"
elif [[ $arch == aarch64 ]]; then
  arch=arm64
  #echo "[-] 64-bit ARM architecture detected"
elif [[ $arch == arm ]]; then
  arch=armv7l
  #echo "[-] 32-bit ARM architecture detected"
elif [[ $arch == ppc64le ]]; then
  arch=ppc64le
  #echo "[-] IBM POWER architecture detected"
elif [[ $arch == s390x ]]; then
  arch=s390x
  #echo "[-] IBM LinuxONE architecture detected"
else
  Red_Error "[x] Sorry, this architecture is not supported yet!\n[x]Please try to install manually: https://github.com/MCSManager/MCSManager#linux"
fi

# Define the variable Node installation directory
node_install_path="/opt/node-$node-linux-$arch"

# Check network connection
echo_cyan "[-] Architecture: $arch"

# Install related software
echo_cyan_n "[+] 正在安装依赖软件 (git, tar, wget)... "
if [[ -x "$(command -v yum)" ]]; then
  yum install -y git tar wget
elif [[ -x "$(command -v apt-get)" ]]; then
  apt-get install -y git tar wget
elif [[ -x "$(command -v pacman)" ]]; then
  pacman -S --noconfirm --needed git tar wget
elif [[ -x "$(command -v zypper)" ]]; then
  zypper --non-interactive install git tar wget
else
  echo_red "[!] 找不到你的软件包管理器! 你需要先去安装 git, tar 和 wget!"
fi

# Determine whether the relevant software is installed successfully
if [[ -x "$(command -v git)" && -x "$(command -v tar)" && -x "$(command -v wget)" ]]; then
  echo_green "Success"
else
  Red_Error "[x] 没有安装 git, tar 和 wget, 请先在安装MCSManager前安装它们!"
fi

# Install the Node environment
Install_Node

# Install MCSManager
Install_MCSManager

# Create MCSManager background service
Create_Service
