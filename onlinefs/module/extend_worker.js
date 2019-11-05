// const AdmZip = require('adm-zip');
const zipper = require("zip-local");
// const iconv = require('iconv-lite');
const fsex = require('fs-extra');
const os = require('os');
const path = require('path');
const fs = require('fs');

let SYSTEM_CODE = null;
if (os.platform() == "win32")
    SYSTEM_CODE = 'GBK';
else
    SYSTEM_CODE = 'UTF-8';

//参数获取
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
        // 旧版本解压方法
        // const zip = new AdmZip(absPath);
        // zip.extractAllTo(zipExtractDir, true);
        // // 解决目录中中文乱码问题
        // const zipEntries = zip.getEntries();
        // for (let i = 0; i < zipEntries.length; i++) {
        //     const entry = zipEntries[i];
        //     entry.entryName = iconv.decode(entry.rawEntryName, SYSTEM_CODE);
        // }
        // //全部解压
        // zip.extractAllTo(zipExtractDir, true);
        try {
            fs.mkdirSync(zipExtractDir);
        } catch (ignore) { }
        zipper.sync.unzip(absPath).save(zipExtractDir);
    }

    //文件删除子进程开始执行
    if (ACTION === 'remove') {
        fsex.removeSync(realArgv[1])
    }

    // 文件压缩子进程
    // 此压缩库支持异步写法，但以防不测，依然列入子进程
    if (ACTION === 'compress') {
        // 异步写法
        // zipper.zip(realArgv[1], function (error, zipped) {
        //     if (!error) {
        //         zipped.compress(); // compress before exporting
        //         var buff = zipped.memory(); // get the zipped file as a Buffer
        //         // or save the zipped file to disk
        //         zipped.save(compressZipPath, function (error) {
        //             if (!error) { }
        //         });
        //     }
        // });
        // 同步写法，我们使用同步写法，因为这是子进程
        const absPath = realArgv[1];
        const compressZipPath = path.normalize(
            path.dirname(absPath) + '/压缩文件_' + path.basename(absPath) + '.zip'
        );
        zipper.sync.zip(absPath).compress().save(compressZipPath);
    }

    process.exit(0);
}
