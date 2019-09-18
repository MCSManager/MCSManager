本页面将告诉你如何利用 MCSManager 软件来创建一个使用 Docker 启动的 Minecraft 服务端。


### 创建Docker

首先在 "基于 DockerFile 创建镜像" 中创建 Docker 镜像。<br>

这个创建镜像可能需要很长一段时间，尤其是如果您是使用的国外源的话，我们建议您再构建之前更换源（前提是你会使用 Linux 的基本工具）。

您可以这样操作（这步可不做，但是建议做）：
```
vi /etc/docker/daemon.json 
{ 
"registry-mirrors": ["https://registry.docker-cn.com"] 
}
```


### 创建服务端

创建服务端十分简单，点击“引导创建服务端”即可。


### 此端的 Docker 配置

创建好服务端之后，点击【参数】到【docker 配置】

在【端口限制】中填写“25565:25565”即可，此意是开放 25565 端口。冒号两边一般情况下保持一致即可。

单击【保存】

### 最后的操作

你已经给你的Minecraft服务端配置好了 Docker，现在只需要上传核心文件，然后启动就行啦！

启动时，Docker 容器会自动加载你的 Minecraft 服务端，保证安全性，稳定性。


### 写在最后

```
docker ps 查看当前 Docker 进程
docker images 查看当前 Docker 有哪些镜像（包括运行和未运行的）
docker kill xxx(mcsd) 强制杀死当前 Docker ，包括你的 Minecraft 服务端（失去控制时使用）
```

