//标准的URL定位器
//如果你的程序不在根目录，可以考虑更改这里，或者你有什么其他姿势。
//保证 99% 的可用性，因为代码历史遗留问题，不能保证所有请求都能通过此 URL 定位器

//某些 login 页面没有 MCSERVER 全局变量，在此实例化
if (window.MCSERVER == undefined) window.MCSERVER = {};

//URL定位器
MCSERVER.URL = function (url, protocol) {
	var _protocol = protocol || 'http://';
	var hostName = window.location.host;
	var openURL = hostName + '/' + url;
	return _protocol + openURL;
};