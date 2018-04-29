//响应层
(function () {
	var DEBUG = false;
	var TOKEN_NAME = '_T0K_N';
	var RES = window.RES = function () {
		return null;
	};
	RES.TOKEN_NAME = TOKEN_NAME;
	RES.TOKEN = null;
	RES.getToken = function (callback) {
		//同源策略可以防止其他域对这里发送一个Ajax请求.
		var _url = MCSERVER.URL("./token?_LoveYouMaster_Time=" + Date.parse(new Date()));
		$.get(_url, function (data, status) {
			data = JSON.parse(data);
			if (data.hasOwnProperty('ResponseValue')) {
				MCSERVER.username = data['ResponseValue'].username;
				callback(data['ResponseValue'].token);
			} else {
				callback(undefined);
			}
		});
	}

	RES.tokenAjax = function (parameter) {
		//请务必主要异步陷阱
		window.RES.getToken(function (token) {
			parameter['token'] = token;
			//			RES.ajax(parameter);
		});
	}

	RES.ajax = function (parameter) {
		if (!parameter['data']) parameter['data'] = {};

		var tokenV = parameter['token'] || RES.TOKEN;
		//		if(tokenV) parameter['data'][TOKEN_NAME] = tokenV;
		if (tokenV != null) parameter['url'] += '?' + TOKEN_NAME + '=' + tokenV;

		$.ajax({
			type: parameter['type'] || "POST",
			url: MCSERVER.URL(parameter['url']),
			data: parameter['data'], //具体实例化
			timeout: parameter['timeout'] || 10000,
			success: function (data, textStatus) {
				try {
					data = JSON.parse(data);
					if (typeof (data) == 'object') {
						if (data['ResponseKey']) {
							window.MI.routeOn(data['ResponseKey'], data['ResponseValue']);
						}
					}
				} catch (e) {
					//返回的不是一个json对象
					DEBUG && console.log("$.ajax 响应数据非一个JSON对象");
				} finally {
					if (parameter['success']) parameter['success'](data, textStatus);
				}
			},
			error: function (XML, textStatus, errorThrown) {
				if (parameter['error']) parameter['error'](XML);
				//alert('操作失败,被服务器拒绝,请保存好内容重新登录.');
				DEBUG && console.log('Ajax ERROR 回调触发');
				DEBUG && console.log(XML);
				DEBUG && console.log(textStatus);
				DEBUG && console.log(errorThrown);
				DEBUG && console.log(XML.responseText);
				//				alert("服务器: " + XML.responseText);
				window.MI.routeOn('ajax/error', XML);
			},
			processData: parameter['processData'] == false || true,
			traditional: parameter['traditional'] == false || true,
			cache: parameter['cache'] || false
		});

	}

	RES.redirectHTML = function (url, key, body, callback) {
		//静态文件均在 public 目录下，动态文件则在不同API接口
		var _url = MCSERVER.URL('./public/' + url);

		//响应事件函数
		function responseCallback(response, status, xhr) {
			if (status != 'success')
				TOOLS.pushMsgWindow("[ " + status + " ] 由于网络或权限问题,请求的网页无法成功！");
			callback && callback();
		}

		if (key == null) {
			//不需要API数据的单页
			$("#ConsoleMain").load(_url, responseCallback);
		} else {
			WS.sendMsg(key, body || '', function () {
				$("#ConsoleMain").load(_url, responseCallback);
			});
		}
	}

	MI.listener("RedirectPage", function () {
		//自动菜单更改
		MCSERVER.autoColmDo();
	});

	RES.redirectPage = function (url, key, body, callback) {
		var showUrl = url.replace(".", "");
		var showKey = key || "Null"
		TOOLS.setHeaderTitle(["正在加载...."].join(" "));
		ToolsLoadingStart(function () {
			MI.rOn('onend');
			PageLoading();
			//替換掉原先存在的 函数。防止新的单页没有这些函数而导致代码二次执行
			MI.rListener('onend', function () {});
			MI.rListener('onload', function () {});
			//触发页面切换事件
			MI.on('RedirectPage', url);
			RES.redirectHTML(url, key, body, function () {
				TOOLS.setHeaderTitle(["当前", showUrl, " | ", "接口", showKey].join(" "));
				MI.on('page/live');
				//赋予的单页刷新
				PAGE.refresh = function () {
					RES.redirectPage(url, key, body, callback);
				}
				ToolsLoadingEnd();
				MI.rOn('onload');
				callback && callback();

			});
		});

	}

	var PageMain = $('#ConsoleMain');
	var ToolsLoading = $('#ToolsLoading'); //进度条
	var ToolsPageLoading = $("#ToolsPageLoading"); //进度条容器

	function ToolsLoadingStart(callback) {
		ToolsLoading.css("width", "0%");
		ToolsPageLoading.css("display", "block");
		PageMain.stop(true, true).animate({
			'opacity': '0'
		}, 150, callback);
	}

	function PageLoading() {
		ToolsLoading.css("width", "70%");
	}

	function ToolsLoadingEnd() {
		ToolsLoading.css("width", "100%");

		PageMain.stop(true, true).animate({
			'opacity': '1'
		}, 150, function () {
			setTimeout(function () {
				ToolsPageLoading.css("display", "none");
			}, 150);

		});
	}

})();