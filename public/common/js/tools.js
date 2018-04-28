//Tools 工具模块
(function () {
	//全局TOOLS
	window.TOOLS = {};

	var _queue = Array();
	var _run = false;

	function showMsgWindow(value, callback) {
		VIEW_MODEL['ToolsInfo'].show = true;
		VIEW_MODEL['ToolsInfo'].msg = value;
		setTimeout(function () {
			VIEW_MODEL['ToolsInfo'].show = false;
			VIEW_MODEL['ToolsInfo'].msg = '';
			callback && callback();
		}, 1800);
	}

	TOOLS.pushMsgWindow = function (value) {
		_queue.push({
			msg: value
		});

		if (_run == true) return;

		function whiles() {
			if (_queue.length <= 0) {
				_run = false;
				return;
			}
			_run = true;
			msgObj = _queue.shift();

			showMsgWindow(msgObj.msg, function () {
				//下一个
				setTimeout(whiles, 200);
			});
		}
		whiles();
	}

	//后端要求打开信息框
	MI.routeListener('window/msg', function (data) {
		TOOLS.pushMsgWindow(data.body);
	});

	TOOLS.isMaster = function (username) {
		return username.substr(0, 1) === "#";
	}

	// XSS 攻击防御函数
	TOOLS.encode = function (html) {
		var rstr = html.replace(/&/gim, '&amp;')
			.replace(/</gim, '&lt;')
			.replace(/>/gim, '&gt;')
			.replace(/\"/gim, '&quot;')
			.replace(/\'/gim, '&apos;')
			.replace(/ /gim, '&nbsp;')
		return rstr;
	}

	TOOLS.decode = function (text) {
		var str = text
			.replace(/&lt;/gim, '<')
			.replace(/&gt;/gim, '>')
			.replace(/&quot;/gim, '"')
			.replace(/&apos;/gim, "'")
			.replace(/&nbsp;/gim, ' ')
			.replace(/<script>/gim, "")
			.replace(/&amp;/gim, '&')
		return str;
	}

	TOOLS.getCookie = function (name) {
		var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
		if (arr = document.cookie.match(reg))
			return unescape(arr[2]);
		else
			return null;
	}

	TOOLS.delCookie = function (name) {
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		var cval = TOOLS.getCookie(name);
		if (cval != null)
			document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
	}

	TOOLS.setCookie = function (name, value) {
		document.cookie = name + "=" + escape(value) + ";expires=" + new Date(Date.now() + 10000 * 60 * 60 * 4).toGMTString();
	}

	//判断是否是一个 标准字符串（标准的定义：仅有字母数字下划线）
	TOOLS.isStdText = function (text) {
		var reg = /^[A-Za-z0-9_#]*$/igm;
		return reg.test(text);
	}

	var cacheHeaderTitleEle = $("#HeaderInfo");
	//设置头上显示什么
	TOOLS.setHeaderTitle = function (text) {
		if (text) {
			cacheHeaderTitleEle.html(TOOLS.encode(text));
		} else {
			cacheHeaderTitleEle.html("");
		}
	}

})();