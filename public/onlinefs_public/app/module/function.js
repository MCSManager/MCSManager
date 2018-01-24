import ajaxMoudule from "./ajax";
import tools from "./tools";

const Ajax = ajaxMoudule.Ajax;
const BASE_DIR = "";

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

exports.ls = (path) => {
    console.log("刷新");
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
};

exports.mkdir = (newName) => {
    console.log("新建目录");
    return promiseAjax(MCSERVER.URL("fs/mkdir"), newName);
};

exports.copy = (fileStack) => {
    console.log("复制");
    return promiseAjax(MCSERVER.URL("fs/cp"), fileStack);
};

exports.paste = () => {
    console.log("粘贴");
    return promiseAjax(MCSERVER.URL("fs/patse"));
};

exports.remove = (fileStack) => {
    console.log("删除");
    return promiseAjax(MCSERVER.URL("fs/rm"), fileStack);
};

exports.cponce = (fileStack) => {
    console.log("剪贴");
    return promiseAjax(MCSERVER.URL("fs/ct"), fileStack);
};

exports.rename = (filesStack, newName) => {
    console.log("重名名:", filesStack[0].name, "->", newName);
    if (filesStack.length == 1) {
        let oldName = filesStack[0].name;
        return promiseAjax(MCSERVER.URL("fs/rename"), {
            oldName: oldName,
            newName: newName
        });
    } else {
        tools.popWindow("非法操作，同时命名多个文件或未选择文件！");
    }

};


exports.upload = (file, progress) => { //$("#m-upload-file")[0].files[0]
    if (typeof FormData != "function") {
        //兼容性
        alert("很遗憾，您的浏览器不兼容异步文件上传。请使用现代浏览器！");
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
};

exports.userInfo = () => {
    tools.popWindowHtml([
        "<div style='text-align: left;'>1. 因单页应用缘故不可同时在同一浏览器内打开两个文件管理",
        "2. 复制目录不可复制到目录本身内",
        "3. 单击文件即可下载，单击目录即可进入目录",
        "4. 如需编辑文件，请下载修改再上传，会自动覆盖重名文件</div>"
    ].join("<br />"), "使用须知", 20000);

}