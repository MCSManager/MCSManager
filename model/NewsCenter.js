const fs = require("fs");
const http = require("http");

//最新动态信息获取模块

//官方新闻API接口
let newsUrl1 = "http://www.suwings.top/mcserver/?_=" + Date.parse(new Date());

let requestNewsUrl = newsUrl1;
let requestNewsCount = 1;

function requestNewsError() {
  if (requestNewsCount <= 5) {
    requestNewsCount++;
    requestNews();
    return;
  }
}

//请求下载最新动态并且缓存到本地
function requestNews() {
  const req = http.get(requestNewsUrl, function (req) {
    var html = "";
    req.on("data", (data) => (html += data));
    req.on("end", () => {
      try {
        JSON.parse(html);
        fs.writeFile("./public/news.json", html, function (err) {
          if (err) {
            return;
          }
        });
      } catch (err) {
        requestNewsError();
      }
    });
  });
  req.on("error", function () {
    requestNewsError();
  });
}

module.exports = {
  requestNews,
};
