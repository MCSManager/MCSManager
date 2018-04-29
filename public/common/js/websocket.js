//Websocket 层
(function () {

	var DEBUG = false; //Websocket DEBUG

	//from @BBleae
	function wsHeartBeatPackage(ws) {
		setInterval(function () {
			ws.sendMsg("HeartBeatPackage", "");
		}, 10000);
	}

	var ify = '\n\n';
	window.WS = new Object();

	window.WS.init = function (openCallback) {
		var wsURL = 'websocket/ws?' + RES.TOKEN_NAME + '=' + RES.TOKEN;
		window.WS = new WebSocket(MCSERVER.URL(wsURL, MCSERVER.WS_PROTOCOL));
		var tmp_callback = null;
		wsHeartBeatPackage(WS); //心跳包定时器开启

		WS.onmessage = function (e) {
			var data = e.data;
			var loc = data.indexOf('\n\n');
			var header = data.substr(0, loc);
			var body = data.substr(loc + 2);
			var obj;
			try {
				obj = JSON.parse(header);
				if (DEBUG) {
					console.log('=== Websocket 收到触发 ===');
					console.log(obj);
					console.log('Body:' + body);
					console.log('=== Websocket 收到结束 ===');
				}
				obj.body = body;
				MI.on('ws/response', obj, body);
				tmp_callback && tmp_callback();
				tmp_callback = null;
			} catch (e) {
				DEBUG && console.log('Websocket 收到的数据异常:');
				DEBUG && console.log('收到的数据是:' + e.data)
				DEBUG && console.log(e)
			}
		};
		WS.onerror = function (err) {
			console.log(err);
			MI.on('ws/error', err);
		};
		WS.onclose = function () {
			MI.on('ws/close', this);
		};
		WS.onopen = function () {
			openCallback && openCallback();
			MI.on('ws/open', this);
		};
		WS.sendMsg = function (value, body, callback) {
			var obj = {
				RequestKey: 'req',
				RequestValue: value
			}
			if (DEBUG) {
				console.log('=== Websocket 发送触发 ===');
				console.log(obj);
				console.log(body);
				console.log('=== Websocket 发送结束 ===');
			}
			var headerStr = JSON.stringify(obj);
			body = body || '';
			if (callback) tmp_callback = callback;
			if (WS.readyState == WS.OPEN) {
				WS.send(headerStr + ify + body);
			} else {
				TOOLS.pushMsgWindow('与服务器链接中断，数据发送失败，请刷新或登陆重试');
			}
			return this;
		}

	}
	return this;
})();



MI.listener('ws/close', function () {
	TOOLS.pushMsgWindow('与服务器连接断开,刷新网页可以重新链接')
});