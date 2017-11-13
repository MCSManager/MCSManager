const fs = require('fs');
const http = require('http');



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
        requestNews()
        MCSERVER.infoLog('Exception'.red, '第一次发起请求失败，启动备用服务器链接', true);
        return;
    }
    MCSERVER.infoLog('Exception'.red, '读取最新动态失败', true);
}


//get 请求外网  
function requestNews() {


    let req = http.get(requestNewsUrl, function(req, res) {
        MCSERVER.log('版本管理机制准备');
        var html = '';

        req.on('data', (data) => html += data);
        req.on('end', () => {
            MCSERVER.log('正在获取版本动态...');
            //判断是否是正确的
            try {
                JSON.parse(html);
                fs.writeFile('./public/news.json', html, function(err) {
                    if (err) {
                        console.error('更新最新资讯写入失败');
                        return;
                    }
                    MCSERVER.log('保存最新版本动态完成')
                    MCSERVER.infoLog('Done','Module 集合与 AppListen 已全部执行')
                });
            } catch (err) {
                // MCSERVER.log('')
                console.error(err)
                requestNewsError();
            }

        });

    });
    req.on("error", function(err) {
        console.error(err)
        requestNewsError();
    });
}
requestNews();