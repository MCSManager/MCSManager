const FileOperate = require("../module/fsoperate").FileOperate;

class FileOperateStructure {
    constructor(rootPath = null, cwd = null) {
        this.rootPath = rootPath;
        this.cwd = cwd;
    }
}


class UseFileOperate {
    constructor(fileOperateStructure) {
        if (!fileOperateStructure || !fileOperateStructure['rootPath']) {
            throw new Error("[UseFileOperate Mineself Error] UseFileOperate(...) Not is FileOperateStructure");
        }
        this.fileOperate = new FileOperate(fileOperateStructure.rootPath);
        this.fileOperateStructure = fileOperateStructure;
    }

    cwd(cwdp) {
        if (cwdp) {
            this.fileOperateStructure.cwd = cwdp;
            return this.fileOperateStructure;
        }
        return this.fileOperateStructure.cwd;
    }

}




exports.FileOperateStructure = FileOperateStructure;
exports.UseFileOperate = UseFileOperate;