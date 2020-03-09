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
		webscoketStatus['tcolor'] = '#ffffff';
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
		window.PAGE = new Object();
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
				onRedirect: function (link, api, item) {
					for (let k in this.items) {
						this.items[k].select = false;
					}
					item.select = true;
					DEBUG && console.log('菜单处网页开始跳转:' + link);
					// 取消黑色幕布
					TOOLS.blackJumbotron(false)
					// 触发菜单选项点击事件
					MI.on("SideMeumClick", null);
					// 跳转
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

	// 终端控制台界面，实时接受服务端终端日志
	// 每当控制面板后端发送实时日志，都将第一时间触发此
	MI.routeListener('server/console/ws', function (data) {
		var text = TOOLS.encodeConsoleColor(data.body);
		MCSERVER.term.write(text);
	});


	// 获取MC服务端终端日志历史记录
	var $ele = document.getElementById('LogHistoryTerminal');
	MI.routeListener('server/console/history', function (data) {
		if (VIEW_MODEL['Terminal']['isHistoryMode']) {
			var text = data.body;
			text = text.replace(/\r\n/igm, '<br />');
			if ((text + $ele.innerHTML).length > 20000) {
				$ele.innerHTML = "";
			}
			$ele.innerHTML = text + $ele.innerHTML;
		} else {
			var text = TOOLS.encodeConsoleColor(data.body);
			MCSERVER.term.write(text);
		}
	});

	// 普通用户主页
	MI.routeListener('genuser/home', function (data) {
		MI.routeCopy('GenHome', data.obj);
	});

	// 配置项试图
	MI.routeListener('server/properties', function (data) {
		MI.routeCopy('ServerProperties', data.obj);
	});

	// 计划任务列表
	MI.routeListener('schedule/list', function (data) {
		MI.routeCopy('ServerSchedule', data.obj);
	});

})();