//标准的URL定位器
if(window.MCSERVER == undefined) window.MCSERVER = {};

MCSERVER.URL = function(url, protocol) {
	var _protocol = protocol || 'http://';
	var hostName = window.location.host;
	//	var port = 23333;
	var openURL = hostName + '/' + url;
	console.log('转换URL:', openURL)
	return _protocol + openURL;
};