const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');
const os = require('os');

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

if (realArgv.length == 1) {
    //解压子进程开始执行
    console.log('[解压]', '解压', realArgv, '任务开始');

    //执行解压
    const absPath = realArgv[0];
    const zip = new AdmZip(absPath);
    const zipExtractDir = absPath.split('.')[0];
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
    console.log('[解压]', '解压', realArgv, '任务结束');
    process.exit(0);
}
