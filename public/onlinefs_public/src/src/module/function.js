import ajaxMoudule from "./ajax";
import tools from "./tools";

const Ajax = ajaxMoudule.Ajax;

function promiseAjax(url, datas = "") {
    return new Promise((resolve, reject) => {
        new Ajax({
            url: url,
            data: datas,
            success(res, obj) {
                resolve(res);
            },
            error(XML, textStatus, errorThrown) {
                reject(XML, textStatus, errorThrown);
            }
        }).ajax();
    });
}

export default {

    ls: (path) => {
        console.log("刷新文件列表");
        return new Promise((resolve, reject) => {
            promiseAjax(MCSERVER.URL("fs/ls"), path).then((data) => {
                //排序
                let res_dir = [];
                let res_file = [];
                for (let k in data) {
                    if (!data[k].isFile) {
                        res_dir.push(data[k]);
                    } else {
                        res_file.push(data[k]);
                    }
                }
                let newRes = res_dir.sort().concat(res_file.sort());
                resolve(newRes);
            }, (XML) => {
                if (XML.status == 401 || XML.status == 403) {
                    tools.popWindow("非法 的访问操作，权限不足，请重新登陆！");
                }
            });
        });
    },

    mkdir: (newName) => {
        console.log("新建目录");
        return promiseAjax(MCSERVER.URL("fs/mkdir"), newName);
    },

    copy: (fileStack) => {
        console.log("复制");
        return promiseAjax(MCSERVER.URL("fs/cp"), fileStack);
    },

    paste: () => {
        console.log("粘贴");
        return promiseAjax(MCSERVER.URL("fs/patse"));
    },

    remove: (fileStack) => {
        console.log("删除");
        return promiseAjax(MCSERVER.URL("fs/rm"), fileStack);
    },

    cponce: (fileStack) => {
        console.log("剪贴");
        return promiseAjax(MCSERVER.URL("fs/ct"), fileStack);
    },

    rename: (filesStack, newName) => {
        console.log("重命名:", filesStack[0].name, "->", newName);
        if (filesStack.length == 1) {
            let oldName = filesStack[0].name;
            return promiseAjax(MCSERVER.URL("fs/rename"), {
                oldName: oldName,
                newName: newName
            });
        } else {
            tools.popWindow("非法操作，同时命名多个文件或未选择文件！");
        }

    },


    upload: (file, progress) => { //$("#m-upload-file")[0].files[0]
        if (typeof FormData != "function") {
            //兼容性检查
            alert("很遗憾，您的浏览器不兼容异步文件上传。请使用现代浏览器！推荐 Chrome！");
            return null;
        }
        var oMyForm = new FormData();
        oMyForm.append("time", new Date().toUTCString());
        oMyForm.append("upload_file", file);
        return new Promise((resolve, reject) => {
            var oReq = new XMLHttpRequest();
            oReq.open("POST", "/fs/upload", true);
            oReq.onload = function (oEvent) {
                if (oReq.status == 200) {
                    resolve("Done");
                } else {
                    reject(oReq.status);
                }
            };
            oReq.upload.addEventListener("progress", (evt) => {
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                progress(percentComplete);
            }, false);
            oReq.send(oMyForm);
        });
    },

    userInfo: () => {
        tools.popWindowHtml([
            "<div style='text-align: center;font-size: 17px;'>因单页应用缘故不可同时在同一浏览器内打开两个文件管理",
            "复制目录不可复制到目录本身内",
            "单击文件即可下载，单击目录即可进入目录",
            "解压需要时间，请耐心等待",
            "编辑文件不可大于100KB</div>"
        ].join("<br />"), "使用须知", 20000);

    },

    //解压
    extractZip: (filesStack) => {
        const MD = 1024 * 1024;
        const fileSize = filesStack[0].size;
        // const filename = filesStack[0].name;
        // if (filename.split('.').length == 2) {
        //     if (filename.split('.')[1] != 'zip' || filename.split('.')[1] != 'ZIP') {
        //         tools.popWindow("目前只支持 zip 格式文件在线解压。", "不可解压", 60000);
        //         return
        //     }
        // }
        //正常解压
        if (fileSize < MD * 40) {
            tools.popWindow("解压后会在文件列表显示解压文件夹，请注意查看。",
                "正在解压", 60000)
                .then(() => location.reload());
        }
        //压缩文件大于 40 MB
        if (fileSize >= MD * 40 && fileSize < MD * 100) {
            tools.popWindow("解压需要时间。当文件列表中显示解压文件夹则解压完成。在此期间，请勿重复进行解压。",
                "解压需要时间", 60000)
                .then(() => location.reload());
        }
        //压缩文件大于 100 MB
        if (fileSize >= MD * 100 && fileSize < MD * 1000) {
            tools.popWindow("压缩文件较大，解压需要时间，请耐心等待，列表中显示文件夹则代表解压完成，请勿重复解压。",
                "需要一点时间", 60000)
                .then(() => location.reload());
        }
        //压缩文件大于 1000 MB
        if (fileSize >= MD * 1000 && fileSize < MD * 2000) {
            tools.popWindow("解压文件很大，需要一定时间，请耐心等待，当列表中显示文件夹则代表解压完成，切勿重复解压！",
                "需要一定时间", 60000)
                .then(() => location.reload());
        }
        //压缩文件大于 2000 MB
        if (fileSize >= MD * 2000) {
            tools.popWindow("解压文件过大，将需要很长时间，切勿重复解压，当解压文件夹显示出来则代表解压完成。",
                "需要很长时间", 60000)
                .then(() => location.reload());
        }
        //异步发送请求,在用户看弹出框时就进行解压，减少整体的耗时
        return promiseAjax(MCSERVER.URL("fs/extract"), filesStack[0].name);
    },

    //压缩文件
    compress: (filesStack) => {
        tools.popWindow("压缩任务已经开始，完成后会在文件列表显示",
            "正在压缩文件", 60000)
            .then(() => location.reload());
        return promiseAjax(MCSERVER.URL("fs/compress"), filesStack[0].name);
    },

    //编辑文件
    editFile: (filesStack) => {
        const filename = filesStack[0].name;
        if (!filesStack[0].isFile) {
            tools.popWindow("不可编辑目录，请选择文本文件", "非法操作");
            return;
        }
        if (filesStack[0].size >= 1024 * 100) {
            tools.popWindow("文件过大，不可编辑。只能编辑小于 100KB 的文本文件", "非法操作", 60000);
            return;
        }
        //从服务器上读取文本
        promiseAjax(MCSERVER.URL("fs/edit_read"), filesStack[0].name).then((data) => {
            tools.openEditor(filename, data, (obj) => {
                //保存操作，覆盖文本
                promiseAjax(MCSERVER.URL("fs/edit_write"), {
                    filename: obj.filename,
                    context: obj.context
                }).then((result) => {
                    if (!result) {
                        tools.popWindow(
                            ['错误！文件', obj.filename, '保存失败!请检查文件权限与正确性，或联系管理员'].join(' '),
                            '保存出错',
                            60000
                        )
                    } else {
                        location.reload();
                    }
                });
            });
        });

    }
}