const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const serverModel = require('../../model/ServerModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const tools = require('../../core/tools');
const fs = require('fs');


WebSocketObserver().listener('docker/new', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;
    let dockerConfig = JSON.parse(data.body);
    //{dockerImageName: "", 
    //dockerfile: "FROM java:latest↵RUN mkdir -p /mcsd↵RUN echo "Asia…teractive tzdata↵WORKDIR / mcsd↵RUN apt - get update"}
    let dockerImageName = dockerConfig.dockerImageName;
    let dockerfileData = dockerConfig.dockerfile;

    if (dockerImageName.trim() == '') return;

    MCSERVER.warning('正在创建 Docker 镜像.');
    MCSERVER.warning('镜像名字:', dockerImageName);
    MCSERVER.warning('DockerFile:\n', dockerfileData);

    try {
        fs.mkdirSync("./docker_temp");
        fs.writeFileSync("./docker_temp/dockerfile", dockerfileData);
        tools.startProcess('docker', ['build', '-t', dockerImageName.trim(), '.'], {
            cwd: './docker_tmp/',
            stdio: 'pipe'
        }, function (msg, code) {
            MCSERVER.warning('创建结果:', msg, code);
        });
    } catch (err) {
        MCSERVER.warning('创建出错：', err);
    }
});