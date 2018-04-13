(function () {
	MCSERVER.findPropertiesShow = function (key) {

		var SuwingsLoveYou = {
			"generator-settings": "用于自定义超平坦世界的生成，不生成超平坦世界请留空",
			"allow-nether": "是否允许下界（包括地狱）",
			"level-name": "世界（地图）名称 不要使用中文",
			"enable-query": "是否允许使用GameSpy4协议的服务器监听器",
			"allow-flight": "是否允许玩家飞行（在任何游戏模式下）",
			"server-port": "服务器端口",
			"level-type": "地图的生成类型",
			"enable-rcon": "是否允许远程访问服务器控制台",
			"force-gamemode": "强制玩家加入时为默认游戏模式",
			"level-seed": "地图种子 默认留空",
			"server-ip": "服务器ip，若不绑定请留空",
			"max-build-height": "玩家在服务器放置方块的最高高度",
			"spawn-npcs": "是否生成村民",
			"white-list": "是否开启白名单",
			"spawn-animals": "是否生成动物",
			"snooper-enabled": "启用数据采集",
			"hardcore": "极限模式（死后自动封禁）",
			"texture-pack": "材质包",
			"online-mode": "在线（正版）验证",
			"pvp": "是否允许玩家掐架",
			"difficulty": "难度0=和平 1=简单 2=普通 3=困难",
			"player-idle-timeout": "允许的挂机时间，单位为分钟 超过限制后自动T出服务器",
			"gamemode": "游戏模式 0=生存 1=创造 2=冒险 3=旁观",
			"max-players": "服务器最大玩家数限制",
			"spawn-monsters": "生成攻击型生物（怪物）",
			"view-distance": "服务器发送给客户端的数据量，决定玩家能设置的视野",
			"generate-structures": "生成世界时生成结构（如村庄）禁止后地牢和地下要塞仍然生成",
			"motd": "服务器信息展示 若使用ColorMotd等插件可留空该选项",
			"op-permission-level": "OP权限等级 ",
			"announce-player-achievements": "玩家获得成就时，是否在服务器聊天栏显示（是否允许其装X）",
			"network-compression-threshold": "网络压缩阈值",
			"resource-pack-sha1": "资源包的SHA-1值，必须为小写十六进制，不是必填选项",
			"enable-command-block": "启用命令方块",
			"resource-pack": "统一资源标识符 (URI) 指向一个资源包。玩家可选择是否使用",
			"max-world-size": "最大世界大小"
		}

		if (SuwingsLoveYou.hasOwnProperty(key)) {
			return SuwingsLoveYou[key];
		} else {
			//Not find, Return space
			return ' ';
		}
	}
})();