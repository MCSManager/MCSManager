const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');
const fsex = require('fs-extra');
const os = require('os');
const path = require('path');

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

if (realArgv.length >= 1) {
    const ACTION = realArgv[0];

    //解压子进程开始执行
    if (ACTION === 'extract') {
        //执行解压
        const absPath = realArgv[1];
        const zip = new AdmZip(absPath);
        //目录名与原文件同名
        const zipExtractDir = path.normalize(
            path.dirname(absPath) + '/解压文件_' + path.basename(absPath, path.extname(absPath))
        );
        console.log('[ 解压任务 ]', '解压', realArgv[1], '任务开始\n', '解压到:', zipExtractDir);
        zip.extractAllTo(zipExtractDir, true);
        // 解决目录中中文乱码问题
        const zipEntries = zip.getEntries();
        for (let i = 0; i < zipEntries.length; i++) {
            const entry = zipEntries[i];
            entry.entryName = iconv.decode(entry.rawEntryName, SYSTEM_CODE);
        }
        //全部解压
        zip.extractAllTo(zipExtractDir, true);
        //解压完成，进程终止
        console.log('[ 解压任务 ]', '解压', realArgv[1], '任务结束');
    }

    //文件删除子进程开始执行
    if (ACTION === 'remove') {
        console.log('[ 删除任务 ]', '删除:', realArgv[1]);
        fsex.removeSync(realArgv[1])
    }

    process.exit(0);
}
