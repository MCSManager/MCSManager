const fs = require('fs');
const http = require('http');

//最新动态信息获取模块，如果你不需要这个功能，你可以将这里的全部代码删除！

//地址 与 备用地址
let newsUrl1 = 'http://www.suwings.top/mcserver/?_=' + Date.parse(new Date());
let newsUrl2 = 'http://mcservermanager.oss-cn-beijing.aliyuncs.com/news.json?_= ' + Date.parse(new Date());

let requestNewsUrl = newsUrl1;
let requestNewsCount = 1;

function requestNewsError() {
    if (requestNewsCount == 1) {
        //尝试第二次链接
        requestNewsUrl = newsUrl2;
        requestNewsCount++;
        requestNews();
        return;
    }
}

//get 请求外网  
function requestNews() {
    let req = http.get(requestNewsUrl, function (req, res) {
        var html = '';
        req.on('data', (data) => html += data);
        req.on('end', () => {
            //判断是否是正确的
            try {
                JSON.parse(html);
                fs.writeFile('./public/news.json', html, function (err) {
                    if (err) {
                        return;
                    }
                });
            } catch (err) {
                requestNewsError();
            }
        });
    });
    req.on("error", function (err) {
        requestNewsError();
    });
}
requestNews();