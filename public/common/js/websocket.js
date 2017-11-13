;
(function () {
	
	var ify = '\n\n';
	window.WS = new Object();

	window.WS.init = function (openCallback) {
		var wsURL = 'websocket/ws?' + RES.TOKEN_NAME + '=' + RES.TOKEN;
		window.WS = new WebSocket(MCSERVER.URL(wsURL, 'ws://'));
		var tmp_callback = null;
		WS.onmessage = function (e) {
			//			console.log('_message:'+e.data);
			var data = e.data;
			var loc = data.indexOf('\n\n');
			var header = data.substr(0, loc);
			var body = data.substr(loc + 2);
			var obj;
			try {
				obj = JSON.parse(header);
				console.log('--------------- Websocket收到触发 ---------------')
				console.log(obj);
				console.log('身体:' + body);
				console.log('--------------- Websocket收到结束 ---------------')
				obj.body = body;
				MI.on('ws/response', obj, body);
				tmp_callback && tmp_callback();
				tmp_callback = null;
				//			MI.routeOn(obj['ResponseKey'], obj['ResponseValue']);
			} catch (e) {
				console.log('Websocket 收到的数据异常:');
				console.log('收到的数据是:' + e.data)
				console.log(e)

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
			console.log('--------------- Websocket发送触发 ---------------')
			console.log(obj);
			console.log(body);
			console.log('--------------- Websocket发送结束 ---------------')
			var headerStr = JSON.stringify(obj);
			body = body || '';
			if (callback) tmp_callback = callback;
			if (WS.readyState == WS.OPEN) {
				WS.send(headerStr + ify + body);
			} else {
				console.log('############# Websocket 已经关闭 #################');
				TOOLS.pushMsgWindow('与服务器链接中断，数据发送失败，请刷新或登陆重试')
			}

			return this;
		}

	}
	return this;
})();



MI.listener('ws/close', function () {
	TOOLS.pushMsgWindow('与服务器连接断开,刷新网页可以重新链接')
});