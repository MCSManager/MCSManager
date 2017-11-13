function print(msg) {
	console.log(msg)
}

var MCSERVER = {};
MCSERVER.URL = function(url, protocol) {
	var _protocol = protocol || 'http://';
	console.log('转换URL:', _protocol + '127.0.0.1:23333/' + url)
	return _protocol + '127.0.0.1:23333/' + url;
};

;
(function(sw) { //表单确认

	var randmun;
	var randmun2;
	var userid;
	var passwd;
	var btn_login;
	var cache = false;
	sw.register('login.error', function(msg) {
		btn_login.removeClass('btn-toolbar').text(msg['info']).addClass('btn-danger');
		setTimeout(function() {
			btn_login.text('重新验证').removeClass('btn-danger').addClass('btn-info').removeAttr('disabled', 'disabled');
			cache = false;
		}, 1000)
	});

	sw.register('login.success', function() {
		btn_login.removeClass('btn-toolbar').addClass('btn-success').text('验证成功 √');
		cache = true; //没必要再允许验证了
		setTimeout(function() {
			console.log('验证成功！浏览器计算能力识别通过。即将跳转网页');
			window.location.href = './home';
		}, 500)
	});
	sw.register('login.msg', function(msg) {
		cache = true;
		btn_login.removeClass('btn-toolbar').removeClass('btn-info').text(msg).addClass('btn-warning');
		setTimeout(function() {
			btn_login.text('验证').removeClass('btn-warning').addClass('btn-info').removeAttr('disabled', 'disabled');
			cache = false;
		}, 1000)
	})

	sw.register('login.form', function(msg) {
		if(msg['userid'] && msg['passwd'] && msg['submit']) {
			userid = $('#' + msg['userid']);
			passwd = $('#' + msg['passwd']);
			btn_login = $('#' + msg['submit']).on('click', function(e) {
				/*$sw.signal('tools.info-success',"欢迎登录,尊敬的"+userid.val())*/
				randmun = sw.signal('tools.rand', [100000000, 999999999])[0];
				randmun2 = sw.signal('tools.rand', [100000000, 999999999])[0];
				if(cache) return false;
				cache = true;
				console.log('表单提交确认:' + userid.val() + " " + passwd.val())
				if(userid.val().length > 18 || userid.val().length < 4) {
					sw.signal('login.msg', '账号长度不正确')
					return false;
				}
				if(passwd.val().length > 18 || passwd.val().length < 6) {
					sw.signal('login.msg', '密码长度不正确')
					return false;
				}
				var id = userid.val();
				var Reg = /^[0-9a-zA-Z_]*$/g;
				if(!Reg.test(id)) {
					sw.signal('login.msg', '账号不符合规范( 0-9 a-z A-Z _ )')
					return false;
				}
				btn_login.attr('disabled', 'disabled').text('正在请求...').removeClass('btn-info') /*.animate({'opacity':'0.5'},200)*/
					.addClass('btn-toolbar');
				setTimeout(function() {
					sw.signal('submit.ajax');
				}, 500);
			});
		}
	});

	sw.register('submit.ajax', function(msg) {
		$.ajax({
			type: "GET",
			url: "login",
			async: true,
			dataType: 'script',
			data: {
				"ky": randmun,
				"userid": userid.val() + ""
			},
			timeout: 2000,
			success: function(data, textStatus) {
				print('[成功1] textStatus：' + textStatus + "  ")
				cache = true; //没必要再允许验证了
				var competer = __server_algorithm__(randmun)
				sw.signal('submit.ajax.passwd', competer)
				//callback();
			},
			error: function(XML, textStatus, errorThrown) {
				print('[失败] textStatus：' + textStatus + "  errorThrown: " + errorThrown);
				sw.signal('login.error', {
					"info": '服务器错误 ×'
				});
			}
		});
	})

	sw.register('submit.ajax.passwd', function(randmun3) {
		console.log('得到计算结果：' + randmun3)
		$.post({
			url: "login",
			data: {
				'p_d': randmun,
				'z_f': randmun3,
				"w_d": randmun2,
				'p_w': passwd.val(),
				"z_s": userid.val()
			},
			success: function(data, textStatus, jqXHR) {
				console.log('login.success 信号发送' + data) /*#data:{'p_d':randmun 正确,'z_f':randmun3 检查码,"w_d":randmun2 错误,'p_w':passwd.val(),"z_s":userid.val()}*/
				if(data == randmun) { //当密码正确的时候，返回这个作为 标示

					sw.signal('login.success', {}) //密码正确
				} else {
					sw.signal('login.error', {
						"info": '账号或密码错误 ×'
					});
				}
			},
			error: function(XML, textStatus, errorThrown) {
				print('[失败2] textStatus：' + textStatus + "  errorThrown: " + errorThrown);
				sw.signal('login.error', {
					"info": '服务器错误 ×'
				});
			}
		});
	});
})(window.$sw);