### 安装 Docker


### Ubuntu 

```bash
sudo apt-get update
sudo apt-get install docker.io
```

启动 Docker 服务（重要）

```bash
sudo service docker start
```
<br />

### Centos
Docker 要求 CentOS 系统的内核版本高于 3.10 ，通过 `uname -r` 命令查看你当前的内核版本。

```bash
yum update -y
yum -y install docker
```

启动 Docker 服务（重要）

```bash
sudo service docker start
```
<br />

### Arch Linux

```bash
安装 Docker
pacman -S docker
启动 Docker
systemctl start docker
开机启动 Docker
systemctl enable docker
关掉开机启动 Docker
systemclt disable docker
```

<br /><br />

### 检查 Docker 环境是否正确（可选）

查看是否已经安装，配好PATH路径，一般而言自动配好了。MCSManager 需要 Docker 命令必须能够执行，否则无法正确使用。


输出版本号即为正确。

```bash
docker version
```

### 检查 Docker 是否能够运行（可选）

运行 Hello world 程序（需要联网下载）。输出内容包含有 "Hello from Docker!" 则代表运行成功代表无问题。

```bash
docker run hello-world
```


### 配置国内镜像源（可选，强烈建议做）

```bash
vi /etc/docker/daemon.json 

{ 
"registry-mirrors": ["https://registry.docker-cn.com"] 
}
```

重启服务。

```bash
sudo service docker restart
```

<br />

### 写在最后

祝您使用愉快！
