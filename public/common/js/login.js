//通用登陆 API js
MCSERVER.login = function (username, password, rand, loginSuccess, loginError, error) {
	var POST_OBJECT = null;
	$.get({
		url: MCSERVER.URL('./user/login_key'),
		//import
		data: {
			username: username,
			_rand: Math.random() //增加缓存拒绝随机数
		},
		success: function (data, textStatus) {
			var obj = JSON.parse(data);
			POST_OBJECT = obj;
			console.log('POST_OBJECT', POST_OBJECT);
			logging();
		},
		error: function () {
			error && error();
		}
	});

	function logging() {
		var md5Password = hex_md5(hex_md5(password) + POST_OBJECT.enkey1) //账号注册时保存的格式
		var md5Passworded = hex_md5(md5Password + POST_OBJECT.enkey2); //登陆的格式
		$.post({
			url: MCSERVER.URL('./user/login'),
			data: {
				username: username,
				password: md5Passworded
			},
			success: function (data, textStatus) {
				var obj = JSON.parse(data);
				//后端指令操作
				if (typeof obj['ResponseValue'] == 'number') {
					var commande = Number.parseInt(obj['ResponseValue']);
					if (commande == 302) {
						alert("您已登录,不可重复或覆盖原先登录,我们将为你跳转网页....");
						window.location.href = '../';
					}
					return;
				}
				//后端警告操作
				if (typeof obj['ResponseValue'] == 'string') {
					alert(obj['ResponseValue']);
					loginError && loginError();
					return;
				}
				//后端正常操作,判断密码与账户
				if (obj['ResponseValue']) {
					loginSuccess && loginSuccess();
				} else {
					loginError && loginError();
				}
			},
			error: function () {
				error && error();
			}
		});
	}
}

// 想要执行登录，我们将自动获取
// id 为 login-userid 与 login-passwd 的 input 元素
$(function () {
	var logining = false;
	var $btnLogin = $('#login-button');
	//login-button    login-userid       login-passwd
	MCSERVER.btnLogin = function () {
		if (logining == true) return;
		logining = true;

		$btnLogin
			.html('正在验证...')
			.attr("disabled", "disabled");

		MCSERVER.login($('#login-userid').val(), $('#login-passwd').val(), Math.random(),
			function () {
				//成功登陆
				$btnLogin
					.html('成功登陆 √')
					.attr("disabled", "disabled");
				console.log('登陆成功√');
				window.location.href = '../';
			},
			function () {
				//错误
				$btnLogin
					.html('登陆失败 X')
					.attr("disabled", "disabled");
				logining = false;
				setTimeout(function () {
					$btnLogin
						.html('重新验证')
						.removeAttr("disabled");;
				}, 1000);
			},
			function () {
				//服务器错误
				$btnLogin
					.html('服务器错误 :(')
					.removeAttr("disabled");
			});

	}
})