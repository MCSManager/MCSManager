(function () {
	// 菜单 数据
	MCSERVER.meumObject = {};

	//非管理员
	MCSERVER.meumObject.notMasterMeum = [{
		class: 'glyphicon-home', //html元素 类
		name: '用户中心', //菜单名
		link: './template/gen_home.html', //单击时跳转目的
		api: 'genuser/home' //通过 Webscoket 后端请求的API,null为不请求
	}, {
		class: 'glyphicon-equalizer',
		name: '技术支持',
		link: './template/gen_about.html',
		api: null
	}, ]

	//管理员的
	//注意，这些页面只能管理员访问，普通用户就算访问，也得不到任何数据
	MCSERVER.meumObject.masterMeum = [{
		class: 'glyphicon-equalizer',
		name: '监控数据中心',
		link: './template/center.html',
		api: 'center/show'
	}, {
		class: 'glyphicon-tasks',
		name: '服务端管理',
		link: './template/server.html',
		api: 'server/view'
	}, {
		class: 'glyphicon-th-large',
		name: '用户权限设定',
		link: './template/userset.html',
		api: 'userset/update'
	}, {
		class: 'glyphicon-floppy-open',
		name: '服务与支持',
		link: './template/feelback.html',
		api: null
	}]

})();