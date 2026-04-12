# MCSManager Monitor Deployment With Codex

This repository contains a modified MCSManager build for Minecraft 1.12.2 monitoring.

Use this guide when a Codex agent is running on one of the Linux hosts.

## Host Roles

- A/B/C: monitored game hosts. Deploy the modified `daemon` only.
- D: panel host. Deploy the modified `web` and frontend.

Do not uninstall BT Panel Docker or the existing Docker daemon. This monitor deployment only replaces MCSManager runtime files.

## Prerequisites

Install official MCSManager first so systemd services and base directories exist:

```bash
sudo su -c "wget -qO- https://script.mcsmanager.com/setup.sh | bash"
```

Expected directories:

```text
/opt/mcsmanager/daemon
/opt/mcsmanager/web
```

Expected services:

```text
mcsm-daemon.service
mcsm-web.service
```

## Deploy Modified Daemon On A/B/C

Clone this repository on the target host, then run:

```bash
cd /root/MCSManager-monitor
chmod +x prod-scripts/linux/deploy-monitor-daemon-from-repo.sh
sudo prod-scripts/linux/deploy-monitor-daemon-from-repo.sh
```

The script will:

- build `daemon/production/app.js`
- stop `mcsm-daemon.service`
- back up `/opt/mcsmanager/daemon`
- replace runtime files
- run production dependency install
- restart `mcsm-daemon.service`
- print the first lines of `/metrics`

Verify:

```bash
systemctl status mcsm-daemon.service --no-pager
ss -lntp | grep 24444
curl -fsS http://127.0.0.1:24444/metrics | grep mcsm_host_disk
```

## Deploy Modified Web On D

Clone this repository on the panel host, then run:

```bash
cd /root/MCSManager-monitor
chmod +x prod-scripts/linux/deploy-monitor-web-from-repo.sh
sudo prod-scripts/linux/deploy-monitor-web-from-repo.sh
```

The script will:

- build `common`
- build `panel`
- build `frontend`
- stop `mcsm-web.service`
- back up `/opt/mcsmanager/web`
- replace web runtime files and `public/`
- run production dependency install
- restart `mcsm-web.service`

Verify:

```bash
systemctl status mcsm-web.service --no-pager
ss -lntp | grep 23333
```

Then open:

```text
http://D_PANEL_IP:23333
```

## Add Remote Nodes In Panel

For each monitored host, read the daemon API key:

```bash
cat /opt/mcsmanager/daemon/data/Config/global.json
```

Use the `key` value when adding a remote node in the panel:

```text
IP: A/B/C internal IP
Port: 24444
API Key: key from global.json
```

## Install Minecraft Monitor Plugin

Build plugin:

```bash
cd mcsm-monitor-plugin
mvn clean package
```

Copy the jar to the Minecraft 1.12.2 server:

```text
plugins/mcsm-monitor-plugin.jar
```

Get instance token from the daemon:

```bash
curl "http://127.0.0.1:24444/v1/plugin/token/INSTANCE_UUID?apikey=DAEMON_API_KEY"
```

Configure plugin:

```yaml
agentUrl: "http://127.0.0.1:24444"
serverId: "INSTANCE_UUID"
instanceToken: "TOKEN_FROM_DAEMON"
```

Restart the Minecraft server.

## Acceptance Checks

In the panel monitor page, verify:

- A/B/C nodes are online.
- node CPU, memory, and disk are visible.
- each managed server shows process CPU and memory.
- servers with plugin installed show TPS and online players.
- `/metrics` includes `mcsm_host_disk_total_bytes`, `mcsm_host_disk_free_bytes`, and `mcsm_host_disk_usage_percent`.

## Rollback

Each script creates a timestamped backup:

```text
/opt/mcsmanager/daemon.bak.YYYYMMDDHHMMSS
/opt/mcsmanager/web.bak.YYYYMMDDHHMMSS
```

Rollback daemon:

```bash
systemctl stop mcsm-daemon.service
rm -rf /opt/mcsmanager/daemon
mv /opt/mcsmanager/daemon.bak.YYYYMMDDHHMMSS /opt/mcsmanager/daemon
systemctl start mcsm-daemon.service
```

Rollback web:

```bash
systemctl stop mcsm-web.service
rm -rf /opt/mcsmanager/web
mv /opt/mcsmanager/web.bak.YYYYMMDDHHMMSS /opt/mcsmanager/web
systemctl start mcsm-web.service
```

