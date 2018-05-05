//ViewModel层
//用于各类数据模型的双向绑定和控制区域

(function () {

	var DEBUG = false;

	//ws 链接事件
	MI.listener('ws/open', function (ws) {
		VIEW_MODEL['websocketStatus'] = {};
		var webscoketStatus = VIEW_MODEL['websocketStatus'];
		webscoketStatus['status'] = '服务器连接正常';
		webscoketStatus['is'] = true;
		webscoketStatus['tcolor'] = '#12ea19';
		VIEW_MODEL.newVue('websocketStatus', {
			el: '#websocket'
		});
		VIEW_MODEL.newVue('websocketStatus', {
			el: '#websocket2'
		});
		//左上角用户显示
		VIEW_MODEL.newVue('websocketStatus', {
			el: '#TitleUser'
		});
	});

	MI.listener('ws/close', function (ws) {
		TOOLS.setHeaderTitle("离线 | 当前与服务器断开..");
		var webscoketStatus = VIEW_MODEL['websocketStatus'];
		webscoketStatus['status'] = '!!! 连接断开 !!!';
		webscoketStatus['is'] = false;
		webscoketStatus['tcolor'] = '#ffffff';
	});

	MI.listener('ws/error', function (ws) {
		var webscoketStatus = VIEW_MODEL['websocketStatus'];
		webscoketStatus['status'] = '!!! 连接错误 !!!';
		webscoketStatus['is'] = false;
		webscoketStatus['tcolor'] = '#ffffff';
	});

	//单页生命周期替换事件
	MI.listener('page/live', function (ws) {
		for (var tmp in PAGE) delete PAGE[tmp];
		delete PAGE;
		PAGE = new Object();
	});


	//菜单获取
	MI.routeListener('ws/muem', function (data) {
		//菜单选项选择
		MI.listener("SideMeumClick", function () {
			DEBUG && console.log("--- 菜单选项被选择 ---");
			// MCSERVER.autoColmDo();
		});

		DEBUG && console.log('--- 系统菜单获取成功 ---');

		MCSERVER.username = data.obj.username;
		//虚拟的数据接受，让前端数据得到，菜单在前端建筑
		if (TOOLS.isMaster(MCSERVER.username)) {
			data.obj.items = MCSERVER.meumObject.masterMeum;
		} else {
			data.obj.items = MCSERVER.meumObject.notMasterMeum;
		}
		//copy
		MI.routeCopy('col-muem', data.obj);
		VIEW_MODEL.newVueOnce('col-muem', {
			el: '#SideColFor',
			data: {
				isOnMouse: false
			},
			methods: {
				onRedirect: function (link, api) {
					DEBUG && console.log('菜单处网页开始跳转:' + link);
					//触发菜单选项点击事件
					MI.on("SideMeumClick", null);
					RES.redirectPage(link, api, 'update_page');
				}
			}
		});

	});

	MI.routeListener('index/update', function (data) {
		MI.routeCopy('SystemUp', data.obj);
		MI.routeCopy('VersionShow', data.obj);
	});

	MI.routeListener('center/show', function (data) {
		MI.routeCopy('centerShow', data.obj);
	});

	MI.routeListener('server/view', function (data) {
		MI.routeCopy('ServerList', data.obj);
	});

	//UsersetList
	MI.routeListener('userset/update', function (data) {
		MI.routeCopy('UsersetList', data.obj);
	});

	//单个服务器的资料显示
	MI.routeListener('server/get', function (data) {
		MI.routeCopy('ServerPanel', data.obj);
	});

	//服务器控制台
	MI.routeListener('server/console', function (data) {
		if (data.obj == null) {
			TOOLS.pushMsgWindow('您并不拥有这个服务器的所有权，需要管理员设定');
			VIEW_MODEL['ConsolePanel'].serverData.name = null;
		}
		MI.routeCopy('ConsolePanel', data.obj);
	});

	MI.routeListener('userset/view', function (data) {
		MI.routeCopy('OneUserView', data.obj);
	});

	//Minecraft 服务器终端插入
	var terminalEncode = function (text) {
		var ify = '[_b_r_]';
		var txt = text;
		txt = txt.replace(/<br \/>/igm, '[_b_r_]');
		var consoleSafe = TOOLS.encode(txt);
		consoleSafe = consoleSafe.replace(/\[_b_r_\]/igm, '<br>');
		return consoleSafe;
	}

	MI.routeListener('server/console/ws', function (data) {
		var consoleSafe = terminalEncode(data.body);
		var MinecraftConsole = document.getElementById('TerminalMinecraft');
		if (MinecraftConsole == null) {
			console.error('MinecraftConsole is null');
			return;
		}
		var flag = false;
		//判断用户是否自己移动了滚轴
		var BUFF_FONTIER_SIZE_DOWN = MinecraftConsole.scrollHeight - MinecraftConsole.clientHeight;
		flag = (MinecraftConsole.scrollTop + 354 >= BUFF_FONTIER_SIZE_DOWN);
		//add
		MinecraftConsole.innerHTML += consoleSafe;
		//unblive bt ths is t
		if (flag)
			MinecraftConsole.scrollTop = MinecraftConsole.scrollHeight;

	});

	//获取控制台历史记录
	MI.routeListener('server/console/history', function (data) {
		var consoleSafe = terminalEncode(data.body);

		var MinecraftConsole = document.getElementById('TerminalMinecraft');
		var ifyLoad =
			'<span style="color:#3af138;">[历史日志] </span>' +
			'<span style="color:rgb(212, 136, 30);">================<br></span>';

		var oldTopV = 0;
		var oldHeightV = MinecraftConsole.scrollHeight;
		//incude
		MinecraftConsole.innerHTML = consoleSafe + ifyLoad + MinecraftConsole.innerHTML;
		var newTopV = MinecraftConsole.scrollTop;
		var newHeightV = MinecraftConsole.scrollHeight;

		var resVTopLac = newHeightV - oldHeightV;
		MinecraftConsole.scrollTop = resVTopLac - 60;
	});

	//普通用户主页
	MI.routeListener('genuser/home', function (data) {
		MI.routeCopy('GenHome', data.obj);
	});

	//配置项试图
	MI.routeListener('server/properties', function (data) {
		MI.routeCopy('ServerProperties', data.obj);
	});

	//配置项试图
	MI.routeListener('soft/view', function (data) {
		MI.routeCopy('SoftProperties', data.obj);
	});

})();