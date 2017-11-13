//通用登陆 API js
MCSERVER.login = function (username, password, rand, loginSuccess, loginError, error) {
	var POST_OBJECT = null;
	$.get({
		url: MCSERVER.URL('./user/login_key'),
		//import
		data: { username: username, wIwdj274: "adFh_u297?4jGs1" },
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
		// console.log('password: ', password)
		// console.log('POST_OBJECT.salt: ', POST_OBJECT.enkey1)
		// console.log('POST_OBJECT.enkey: ', POST_OBJECT.enkey2)
		var md5Password = hex_md5(hex_md5(password) + POST_OBJECT.enkey1)//账号注册时保存的格式
		var md5Passworded = hex_md5(md5Password + POST_OBJECT.enkey2);//登陆的格式
		// console.log('md5Passworded:', md5Passworded);
		$.post({
			url: MCSERVER.URL('./user/login'),
			data: {
				username: username,
				password: md5Passworded
				// enkey: POST_OBJECT.enkey2,
				// rand: rand || 0
			},
			success: function (data, textStatus) {
				var obj = JSON.parse(data);
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
		MCSERVER.login($('#login-userid').val(), $('#login-passwd').val(), 548314,
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
					.html('服务器错误，请重试登陆')
					.removeAttr("disabled");
			});

	}
})