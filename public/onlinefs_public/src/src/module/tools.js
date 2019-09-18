//工具类

import swal from 'sweetalert2';

export default {
    //弹出提示框     
    popWindow: function (data, title, timer) {
        console.log("弹出:", data);
        return swal.fire({
            title: title || "",
            text: '' + data,
            timer: timer || 5000
        });
    },

    popWindowHtml: (html, title, timer) => {
        swal.fire({
            title: title || "",
            type: 'info',
            html: html,
            width: 600
        });
    },


    confirm: (msg, callbackt, callbackf) => {
        swal.fire({
            title: 'Are you sure?',
            text: msg,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
        }).then(function (isConfirm) {
            if (isConfirm.value) {
                callbackt && callbackt();
            } else {
                callbackf && callbackf();
            }
        });
    },

    prompt: (msg, callbackT, callbackF) => {
        swal.fire({
            title: msg,
            input: 'text',
            showCancelButton: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            showLoaderOnConfirm: true,
            preConfirm: function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve();
                    }, 500);
                });
            },
            allowOutsideClick: false
        }).then((text) => {
            if (text && text.value)
                callbackT && callbackT(text.value);
            else
                callbackF && callbackF("");
        });
    },

    encodeContext: (text) => {
        let tmp = new String(text);
        tmp = tmp.replace(/ /g, "&nbsp;");
        tmp = tmp.replace(/</g, "&lt;");
        tmp = tmp.replace(/>/g, "&gt;");
        // tmp = tmp.replace(/&/g, "&gt;");
        // tmp = tmp.replace(/\'/g, "&#39;");
        // tmp = tmp.replace(/\"/g, "&quit;");
        // tmp = tmp.replace(/\n/igm, "<>");
        return tmp;
    },

    openEditor: (filename, context, callback) => {
        // editorDisplay: true,
        // editorCallback: obj => console.log("保存:", obj),
        // editorOpenContext: "- 显示错误 -",
        // editorFilename: "index.html"
        MCSERVER.pageIndexModel.editorDisplay = true;
        MCSERVER.pageIndexModel.editorCallback = obj => callback(obj);
        MCSERVER.pageIndexModel.editorOpenContext = context || "";
        MCSERVER.pageIndexModel.editorFilename = filename;
    }

}