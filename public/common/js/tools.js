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

	TOOLS.isSmallDate = function (text) {
		var reg = /^[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}$/igm
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

	//Minecraft 服务器输出删除双S
	TOOLS.deletDoubleS = function (text) {
		text = text.replace(/§[0-9A-Za-z]{1}/igm, "");
		return text;
	}

	//Minecraft 服务器输出基本颜色
	TOOLS.encodeConsoleColor = function (text) {
		text = text.replace(/([A-Za-z _&;-\\.]{1,}:)/igm, "<span style='color:#ffa700;'>$1</span>");
		text = text.replace(/\[/igm, "<span style='color:#10e616;'>[</span>");
		text = text.replace(/\]/igm, "<span style='color:#10e616;'>]</span>");
		text = text.replace(/INFO/gm, "<span style='color:#03ea0a;'>INFO</span>");
		text = text.replace(/(\d{2,}:\d{2,}:\d{2,})/gm, "<span style='color:#017EBC;'>$1</span>");

		RegExpStringArr = [
			//蓝色
			["Unknown command", "Loading libraries, please wait...",
				"Loading", "Loaded", "\\d{1,3}%", "true", "false",
				"plugin.yml"
			],
			//绿色
			["/help", "left the game", "Enabling",
				"Saving chunks for level", "--------", "UUID", "Starting minecraft server version",
				"Timings Reset",
				"\\(", "\\)", "\\{", "\\}", "&lt;", "&gt;",
				"Preparing start region for level"
			],
			//红色
			["WARN", "EULA", "Error", "Invalid", "Stopping the server", "Caused by", "Stopping"],
			//黄色
			[
				"Starting Minecraft server on",
				"world_the_end",
				"world_nether",
				"Usage",
				"Server thread", "Done", "MCSMANAGER"
			]
		]
		for (var k in RegExpStringArr) {
			for (var y in RegExpStringArr[k]) {

				var reg = new RegExp(
					"(" + RegExpStringArr[k][y].replace(/ /igm, "&nbsp;") + ")",
					"igm");
				if (k == 0) //蓝色
					text = text.replace(reg, "<span style='color:#009fef;'>$1</span>");
				if (k == 1) //绿色
					text = text.replace(reg, "<span style='color:#10e616;'>$1</span>");
				if (k == 2) //红色
					text = text.replace(reg, "<span style='color:#ea1f1a;'>$1</span>");
				if (k == 3) //黄色
					text = text.replace(reg, "<span style='color:#ffa700;'>$1</span>");

			}
		}
		return text;
	}

	// 弹窗
	var _popWindCallback = null;
	TOOLS.popWind = function (config) {
		var popWinContext = $("#PopWinContext");
		_popWindCallback = config.callback || function () {}; //全局的callback变量
		var css = config.style || {
			display: "block"
		};
		popWinContext.html("<p>正在加载信息框,请稍等...</p>");

		$("#PopWinTitle").html(config.title || "信息对话框");
		$(".PopWin").css(css)
			.css({
				display: "block"
			});
		$("#balckWarp").css({
			display: "block"
		});
		console.log("信息框弹出", "配置:", config);
		popWinContext.load(config.template, function (response, status, xhr) {
			if (status != 'success') {
				popWinContext.html("信息框加载失败！请保持网络通畅！单击灰色区域关闭！");
				return;
			}
		});
	}
	TOOLS.popWindClose = function (res) {
		$(".PopWin").removeAttr("style");
		$("#balckWarp").removeAttr("style");
		//返回结果
		_popWindCallback(res);
		_popWindCallback = null;
	}

})();