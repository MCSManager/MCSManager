//工具类

import swal from 'sweetalert2';

//弹出提示框     
exports.popWindow = (data, title, timer) => {
    console.log("弹出:", data);
    swal({
        title: title || "",
        text: '' + data,
        timer: timer || 5000
    });
};

exports.popWindowHtml = (html, title, timer) => {
    //可能的 XSS 攻击！
    swal({
        title: title || "",
        type: 'info',
        html: html,
        width: 600
    });
}


exports.confirm = (msg, callbackt, callbackf) => {
    swal({
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
};

exports.prompt = (msg, callbackT, callbackF) => {
    swal({
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
};

exports.encodeContext = (text) => {
    let tmp = new String(text);
    tmp = tmp.replace(/ /g, "&nbsp;");
    tmp = tmp.replace(/</g, "&lt;");
    tmp = tmp.replace(/>/g, "&gt;");
    // tmp = tmp.replace(/&/g, "&gt;");
    // tmp = tmp.replace(/\'/g, "&#39;");
    // tmp = tmp.replace(/\"/g, "&quit;");
    // tmp = tmp.replace(/\n/igm, "<>");
    return tmp;
};