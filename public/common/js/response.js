;
(function() {
	var TOKEN_NAME = '_T0K_N';
	var RES = window.RES = function() {
		return null;
	};
	RES.TOKEN_NAME = TOKEN_NAME;
	RES.TOKEN = null;
	RES.getToken = function(callback) {
		//		同源策略可以防止其他域对这里发送一个Ajax请求.
		var _url = MCSERVER.URL("./token?_LoveYouMaster_Time=" + Date.parse(new Date()));
		$.get(_url, function(data, status) {
			data = JSON.parse(data);
			if(data.hasOwnProperty('ResponseValue')) {
				MCSERVER.username = data['ResponseValue'].username;
				callback(data['ResponseValue'].token);
			} else {
				callback(undefined);
			}
		});
		//		var token = TOOLS.getCookie('token_to') || '';
		//		var username = TOOLS.getCookie('username_to');
		//		console.log('！！！！！！返回 TOKEN ',token,'username ',username);
		//		
		//		TOOLS.delCookie('token_to');
		//		TOOLS.delCookie('username_to');
		//		TOOLS.setCookie('is_to','1');

		//		if(token == '') {
		//			console.log('token ==  || username == ')
		//			window.location.href = '../../token?callback=' + encodeURI('http://sub.mine.ol:23333/public/');
		//			return;
		//		}

//		MCSERVER.username = u  sername;
//		callback(token);
	}

	RES.tokenAjax = function(parameter) {
		//请务必主要异步陷阱
		window.RES.getToken(function(token) {
			parameter['token'] = token;
			//			RES.ajax(parameter);
		});
	}

	RES.ajax = function(parameter) {
		if(!parameter['data']) parameter['data'] = {};

		var tokenV = parameter['token'] || RES.TOKEN;
		//		if(tokenV) parameter['data'][TOKEN_NAME] = tokenV;
		if(tokenV != null) parameter['url'] += '?' + TOKEN_NAME + '=' + tokenV;

		$.ajax({
			type: parameter['type'] || "POST",
			url: MCSERVER.URL(parameter['url']),
			data: parameter['data'], //具体实例化
			timeout: parameter['timeout'] || 5000,
			success: function(data, textStatus) {
				try {
					data = JSON.parse(data);
					if(typeof(data) == 'object') {
						if(data['ResponseKey']) {
							window.MI.routeOn(data['ResponseKey'], data['ResponseValue']);
						}
					}
				} catch(e) {
					console.log('返回的不是一个json对象');
				} finally {
					if(parameter['success']) parameter['success'](data, textStatus);
				}
			},
			error: function(XML, textStatus, errorThrown) {
				if(parameter['error']) parameter['error'](XML);
				//alert('操作失败,被服务器拒绝,请保存好内容重新登录.');
				console.log('Ajax ERROR 回调触发');
				console.log(XML);
				console.log(textStatus);
				console.log(errorThrown);
				console.log(XML.responseText);
				//				alert("服务器: " + XML.responseText);
				window.MI.routeOn('ajax/error', XML);
			},
			processData: parameter['processData'] == false || true,
			traditional: parameter['traditional'] == false || true,
			cache: parameter['cache'] || false
		});

	}

	RES.redirectHTML = function(url, key, body, callback) {
		//静态文件均在 public 目录下，动态文件则在不同API接口
		var _url = MCSERVER.URL('./public/' + url, 'http://');
		if(key == null) {
			//不需要API数据的单页
			$("#ConsoleMain").load(_url, function() {
				callback && callback();
				return;
			});
		} else {
			WS.sendMsg(key, body || '', function() {
				$("#ConsoleMain").load(_url, function() {
					callback && callback();
				});
			});
		}
	}
	
	var PageMain = $('#ConsoleMain');
	RES.redirectPage = function(url, key, body, callback) {
		PageMain.stop(true, true).animate({
			'opacity': '0'
			// 'margin-left':'50px'
		}, 150, MmDoing);

		//切换事件处理
		function MmDoing() {
			MI.rOn('onend');
			//替換掉原先存在的 函数。防止新的单页没有这些函数而导致代码二次执行
			MI.rListener('onend', function() {});
			MI.rListener('onload', function() {});
			RES.redirectHTML(url, key, body, function() {
				MI.on('page/live'); //MCSERVER.URL(
				//赋予的单页刷新
				PAGE.refresh = function() {
					RES.redirectPage(url, key, body, callback);
				}
				MI.rOn('onload');
				callback && callback();
				PageMain.stop(true, true).animate({
					'opacity': '1'
					// 'margin-left':'0px'
				}, 150);
			});
		}

	}
})();