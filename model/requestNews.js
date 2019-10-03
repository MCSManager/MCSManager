const fs = require('fs');
const http = require('http');

//最新动态信息获取模块

//官方新闻API接口
let newsUrl1 = 'http://www.suwings.top/mcserver/?_=' + Date.parse(new Date());

let requestNewsUrl = newsUrl1;
let requestNewsCount = 1;

function requestNewsError() {
    if (requestNewsCount == 1) {
        //尝试第二次链接
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

module.exports = requestNews;