const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const serverModel = require('../../model/ServerModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const tools = require('../../core/tools');
const fs = require('fs');
const childProcess = require('child_process');


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
    dockerfileData = dockerfileData.replace(/\&gt;/igm, ">")
    dockerfileData = dockerfileData.replace(/\&lt;/igm, "<")
    dockerfileData = dockerfileData.replace(/\&nbsp;/igm, " ")
    MCSERVER.warning('DockerFile:\n', dockerfileData);

    try {
        if (!fs.existsSync("./docker_temp")) fs.mkdirSync("./docker_temp");
        fs.writeFileSync("./docker_temp/dockerfile", dockerfileData);
        // tools.startProcess('docker', ['build', '-t', dockerImageName.trim(), './docker_tmp/'], {
        //     cwd: '.',
        //     stdio: 'pipe'
        // }, function (msg, code) {
        //     MCSERVER.warning('创建结果:', msg, code);
        // });

        let process =
            childProcess.spawn("docker", ['build', '-t', dockerImageName.trim(), './docker_tmp/'], {
                cwd: '.',
                stdio: 'pipe'
            });
        process.on('exit', (code) => {
            // callback('exit', code);
            console.log("EXIT", code)
        });
        process.on('error', (err) => {
            MCSERVER.error('Docker 创建出错', err);
        });
        process.stdout.on('data', (data) => {
            // console.log(data)
            let e = iconv.decode(data, 'utf-8');
            console.log(e)
        });
        process.stderr.on('data', (data) => {
            let e = iconv.decode(data, 'utf-8');
            console.log(e)
        });

    } catch (err) {
        MCSERVER.warning('创建出错：', err);
    }
});