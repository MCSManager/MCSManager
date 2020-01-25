const path = require('path');
const fs = require('fs');
const compressing = require('compressing');
const fsex = require('fs-extra');

// 任务参数获取
const argv = process.argv;
const realArgv = argv.filter((val, index) => {
    return index >= 2
});

// 特殊文件操作子进程
// 为了防止用户解压/压缩/删除 文件数量过大导致整个面板反应速度下降或者无反应
// 所有耗时的文件操作（除非异步）均写入此。
if (realArgv.length >= 1) {
    const ACTION = realArgv[0];

    //解压子进程开始执行
    if (ACTION === 'extract') {
        //执行解压
        const absPath = realArgv[1];
        //目录名与原文件同名
        const zipExtractDir = path.normalize(
            path.dirname(absPath) + '/解压文件_' + path.basename(absPath, path.extname(absPath))
        );
        // 创建目标目录
        try {
            fs.mkdirSync(zipExtractDir);
        } catch (ignore) {
            // 忽略创建目录错误
        }
        // 进行解压操作
        compressing.zip.uncompress(absPath, zipExtractDir)
            .then(() => {
                console.log('解压任务', absPath, '成功.');
            })
            .catch(err => {
                console.log('解压任务', absPath, '失败，原因:\n', err);
            });
    }

    // 文件删除子进程开始执行
    // 此进程用于删除大量文件时使用，以防造成面板卡顿
    if (ACTION === 'remove') {
        fsex.removeSync(realArgv[1])
    }

    // 文件压缩子进程
    // 此压缩库支持异步写法，但以防不测，依然列入子进程
    if (ACTION === 'compress') {
        const absPath = realArgv[1];
        const compressZipPath = path.normalize(
            path.dirname(absPath) + '/压缩文件_' + path.basename(absPath) + '.zip'
        );
        // 进行压缩操作
        compressing.zip.compressDir(absPath, compressZipPath)
            .then(() => {
                console.log('压缩任务', absPath, '成功.');
            })
            .catch(err => {
                console.log('压缩任务', absPath, '失败，原因:\n', err);
            });
    }
}

