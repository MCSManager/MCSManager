/* eslint-disable no-unused-vars */
//Tools 工具模块
(function () {
  //全局TOOLS
  window.TOOLS = {};

  var _queue = Array();
  var _run = false;

  function showMsgWindow(value, callback) {
    VIEW_MODEL["ToolsInfo"].show = true;
    VIEW_MODEL["ToolsInfo"].msg = value;
    setTimeout(function () {
      VIEW_MODEL["ToolsInfo"].show = false;
      VIEW_MODEL["ToolsInfo"].msg = "";
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
      var msgObj = _queue.shift();

      showMsgWindow(msgObj.msg, function () {
        //下一个
        setTimeout(whiles, 200);
      });
    }
    whiles();
  };

  //后端要求打开信息框
  MI.routeListener("window/msg", function (data) {
    TOOLS.pushMsgWindow(data.body);
  });

  TOOLS.isMaster = function (username) {
    return username.substr(0, 1) === "#";
  };

  // XSS 攻击防御函数
  TOOLS.encode = function (html) {
    var rstr = html.replace(/&/gim, "&amp;").replace(/</gim, "&lt;").replace(/>/gim, "&gt;").replace(/"/gim, "&quot;").replace(/'/gim, "&apos;").replace(/ /gim, "&nbsp;");
    return rstr;
  };

  TOOLS.decode = function (text) {
    var str = text
      .replace(/&lt;/gim, "<")
      .replace(/&gt;/gim, ">")
      .replace(/&quot;/gim, '"')
      .replace(/&apos;/gim, "'")
      .replace(/&nbsp;/gim, " ")
      .replace(/<script>/gim, "")
      .replace(/&amp;/gim, "&");
    return str;
  };

  TOOLS.getCookie = function (name) {
    var arr,
      reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if ((arr = document.cookie.match(reg))) return unescape(arr[2]);
    else return null;
  };

  TOOLS.delCookie = function (name) {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval = TOOLS.getCookie(name);
    if (cval != null) document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
  };

  TOOLS.setCookie = function (name, value) {
    document.cookie = name + "=" + escape(value) + ";expires=" + new Date(Date.now() + 10000 * 60 * 60 * 4).toGMTString();
  };

  //判断是否是一个 标准字符串（标准的定义：仅有字母数字下划线）
  TOOLS.isStdText = function (text) {
    var reg = /^[A-Za-z0-9_#]*$/gim;
    return reg.test(text);
  };

  TOOLS.isSmallDate = function (text) {
    var reg = /^[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}$/gim;
    return reg.test(text);
  };

  //设置头上显示什么 已舍弃
  TOOLS.setHeaderTitle = function () { };

  //Minecraft 服务器输出删除双S
  TOOLS.deletDoubleS = function (text) {
    text = text.replace(/§[0-9A-Za-z]{1}/gim, "");
    return text;
  };

  //Minecraft 服务器输出基本颜色
  TOOLS.encodeConsoleColor = function (text) {
    var term = MCSERVER.term;
    if (!term) term = {};
    term.TERM_NULL = "\x1B[0m";
    term.TERM_TEXT_RED = "\x1B[1;0;31m";
    term.TERM_TEXT_GREEN = "\x1B[1;0;32m";
    term.TERM_TEXT_YELLOW = "\x1B[1;0;33m";
    term.TERM_TEXT_BLUE = "\x1B[1;1;34m";
    term.TERM_TEXT_FUCHSIA = "\x1B[1;0;35m";
    term.TERM_TEXT_CYAN = "\x1B[1;0;36m";
    term.TERM_TEXT_WHITE = "\x1B[1;0;37m";
    term.TERM_TEXT_B = "\x1B[1m";

    // 基本颜色
    text = text.replace(/([A-Za-z _§&;\-\\.]{1,}:)/gim, "§6$1§r");
    text = text.replace(/INFO/gm, term.TERM_TEXT_GREEN + "INFO" + term.TERM_NULL);
    text = text.replace(/(\d{2,}:\d{2,}:\d{2,})/gm, term.TERM_TEXT_CYAN + "$1" + term.TERM_NULL);

    // Minecraft 原生颜色替代解析
    text = text.replace(/§0/gm, term.TERM_TEXT_WHITE);
    text = text.replace(/§1/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/§2/gm, term.TERM_TEXT_GREEN);
    text = text.replace(/§3/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/§4/gm, term.TERM_TEXT_RED);
    text = text.replace(/§5/gm, term.TERM_TEXT_FUCHSIA);
    text = text.replace(/§6/gm, term.TERM_TEXT_YELLOW);
    text = text.replace(/§7/gm, term.TERM_TEXT_WHITE);
    text = text.replace(/§8/gm, term.TERM_TEXT_WHITE);
    text = text.replace(/§9/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/§a/gm, term.TERM_TEXT_GREEN);
    text = text.replace(/§b/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/§c/gm, term.TERM_TEXT_RED);
    text = text.replace(/§d/gm, term.TERM_TEXT_RED);
    text = text.replace(/§e/gm, term.TERM_TEXT_YELLOW);
    text = text.replace(/§f/gm, term.TERM_TEXT_WHITE);
    // 基于&符号
    text = text.replace(/&0/gm, term.TERM_TEXT_WHITE);
    text = text.replace(/&1/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/&2/gm, term.TERM_TEXT_GREEN);
    text = text.replace(/&3/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/&4/gm, term.TERM_TEXT_RED);
    text = text.replace(/&5/gm, term.TERM_TEXT_FUCHSIA);
    text = text.replace(/&6/gm, term.TERM_TEXT_YELLOW);
    text = text.replace(/&7/gm, term.TERM_TEXT_WHITE);
    text = text.replace(/&8/gm, term.TERM_TEXT_WHITE);
    text = text.replace(/&9/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/&a/gm, term.TERM_TEXT_GREEN);
    text = text.replace(/&b/gm, term.TERM_TEXT_CYAN);
    text = text.replace(/&c/gm, term.TERM_TEXT_RED);
    text = text.replace(/&d/gm, term.TERM_TEXT_RED);
    text = text.replace(/&e/gm, term.TERM_TEXT_YELLOW);
    text = text.replace(/&f/gm, term.TERM_TEXT_WHITE);
    // 字体格式
    text = text.replace(/§r/gm, term.TERM_NULL);
    text = text.replace(/&r/gm, term.TERM_NULL);
    text = text.replace(/§k/gm, "\x1B[1m");
    text = text.replace(/&k/gm, "\x1B[1m");
    text = text.replace(/§l/gm, "\x1B[1m");
    text = text.replace(/&l/gm, "\x1B[1m");
    text = text.replace(/§m/gm, "\x1B[2m");
    text = text.replace(/&m/gm, "\x1B[2m");
    text = text.replace(/§n/gm, "\x1B[4m");
    text = text.replace(/&n/gm, "\x1B[4m");
    text = text.replace(/§o/gm, "\x1B[3m");
    text = text.replace(/&o/gm, "\x1B[3m");

    // 特殊文本替换
    var RegExpStringArr = [
      //蓝色
      ["Unknown command", "Loading libraries, please wait...", "Loading", "Loaded", "\\d{1,3}%", "true", "false", "plugin.yml"],
      //绿色
      [
        "/help",
        "left the game",
        "Enabling",
        "Server thread",
        "Saving chunks for level",
        "----",
        "UUID",
        "Starting minecraft server version",
        "Timings Reset",
        "\\(",
        "\\)",
        "\\{",
        "\\}",
        "&lt;",
        "&gt;",
        "Preparing start region for level"
      ],
      //红色
      ["WARN", "EULA", "Error", "Invalid", "Stopping the server", "Caused by", "Stopping"],
      //黄色
      ["Starting Minecraft server on", "world_the_end", "world_nether", "Done", "MCSMANAGER"]
    ];
    for (var k in RegExpStringArr) {
      for (var y in RegExpStringArr[k]) {
        var reg = new RegExp("(" + RegExpStringArr[k][y].replace(/ /gim, "&nbsp;") + ")", "igm");
        if (k == 0)
          //蓝色
          text = text.replace(reg, term.TERM_TEXT_BLUE + "$1" + term.TERM_NULL);
        if (k == 1)
          //绿色
          text = text.replace(reg, term.TERM_TEXT_GREEN + "$1" + term.TERM_NULL);
        if (k == 2)
          //红色
          text = text.replace(reg, term.TERM_TEXT_RED + "$1" + term.TERM_NULL);
        if (k == 3)
          //黄色
          text = text.replace(reg, term.TERM_TEXT_YELLOW + "$1" + term.TERM_NULL);
      }
    }
    // 行结尾符号替换
    text = text.replace(/\r\n/gm, term.TERM_NULL + "\r\n");
    return text;
  };

  //Minecraft 服务器输出基本颜色
  TOOLS.encodeConsoleColorForHtml = function (text) {
    // 删除 Linux 终端颜色代码
    text = text.replace(/\033((.|\n)+?)\033\[0m/gim, "");
    text = text.replace(/\033\[m/gim, "");
    text = text.replace(/\033\[0m/gim, "");
    // 其他颜色代码
    text = text.replace(/\n/gim, "<br />");
    text = text.replace(/([A-Za-z _&;-\\.]{1,}:)/gim, "<span style='color:#ffa700;'>$1</span>");
    text = text.replace(/\[/gim, "<span style='color:#10e616;'>[</span>");
    text = text.replace(/\]/gim, "<span style='color:#10e616;'>]</span>");
    text = text.replace(/(\d{2,}:\d{2,}:\d{2,})/gm, "<span style='color:#017EBC;'>$1</span>");
    text = text.replace(/§[0-9A-Za-z]{1}/gim, "");

    var RegExpStringArr = [
      //蓝色
      ["\\d{1,3}%", "true", "false"],
      //绿色
      [
        "--------",
        "\\(",
        "\\)",
        "\\{",
        "\\}",
        "&lt;",
        "&gt;",
        "Preparing start region for level"
      ],
      //红色
      ["WARN", "Error", "Caused by"],
      //黄色
      ["MCSMANAGER"]
    ];
    for (var k in RegExpStringArr) {
      for (var y in RegExpStringArr[k]) {
        var reg = new RegExp("(" + RegExpStringArr[k][y].replace(/ /gim, "&nbsp;") + ")", "igm");
        if (k == 0)
          //蓝色
          text = text.replace(reg, "<span style='color:#009fef;'>$1</span>");
        if (k == 1)
          //绿色
          text = text.replace(reg, "<span style='color:#10e616;'>$1</span>");
        if (k == 2)
          //红色
          text = text.replace(reg, "<span style='color:#ea1f1a;'>$1</span>");
        if (k == 3)
          //黄色
          text = text.replace(reg, "<span style='color:#ffa700;'>$1</span>");
      }
    }
    return text;
  };

  // 弹窗
  var _popWindCallback = null;
  TOOLS.popWind = function (config) {
    var popWinContext = $("#PopWinContext");
    _popWindCallback = config.callback || function () { }; //全局的callback变量
    var css = config.style || {
      display: "block"
    };
    popWinContext.html("<p>正在加载信息框,请稍等...</p>");

    $("#PopWinTitle").html(config.title || "信息对话框");
    $(".PopWin").css(css).css({
      display: "block"
    });
    $("#balckWarp").css({
      display: "block"
    });
    popWinContext.load(config.template, function (response, status, xhr) {
      if (status != "success") {
        popWinContext.html("信息框加载失败！请保持网络通畅！单击灰色区域关闭！");
        return;
      }
    });
  };

  TOOLS.popWindClose = function (res) {
    $(".PopWin").removeAttr("style");
    $("#balckWarp").removeAttr("style");
    //返回结果
    _popWindCallback(res);
    _popWindCallback = null;
  };

  TOOLS.blackJumbotron = function (boolean) {
    if (boolean) {
      $("#balckWarp").css({
        display: "block"
      });
    } else {
      $("#balckWarp").removeAttr("style");
    }
  };

  // 异步大文件上传方案
  // $("#m-upload-file")[0].files[0] 参数 进程回调
  TOOLS.fileupload = function (file, url, args, progressCallback, successCallback, failureCallback) {
    if (typeof FormData != "function") {
      alert("很遗憾，您的浏览器不兼容异步文件上传。请使用现代浏览器！推荐 Chrome！");
      return null;
    }
    console.log(file);
    var oMyForm = new FormData();
    oMyForm.append("time", new Date().toUTCString());
    oMyForm.append("upload_file", file);
    for (var k in args) {
      oMyForm.append(k, args[k]);
    }
    var oReq = new XMLHttpRequest();
    oReq.open("POST", url, true);
    oReq.onload = function (oEvent) {
      if (oReq.status == 200) {
        successCallback && successCallback();
      } else {
        failureCallback && failureCallback();
      }
    };
    oReq.upload.addEventListener(
      "progress",
      function (evt) {
        var percentComplete = Math.round((evt.loaded * 100) / evt.total);
        progressCallback(percentComplete);
      },
      false
    );
    oReq.send(oMyForm);
  };

  TOOLS.page = function (toUrl) {
    var url = window.location.href;
    //page=template/component/console.html&api=server/console&v=sds
    var parameter = url.split("#")[1];
    if (!parameter) return false;
    // [api=server/console,xxx=xxx]
    parameter = parameter.split("&");
    var parameters = {};
    for (var k in parameter) {
      var z = parameter[k].split("=");
      parameters[z[0]] = z[1];
    }
    console.log(parameters);
    if (parameters["page"]) {
      RES.redirectPage("./" + parameters["page"] + ".html", parameters["api"], parameters["listen"]);
      return true;
    } else {
      return false;
    }
  };

  TOOLS.definePage = function (v1, v2, v3) {
    if (MCSERVER.listenServername) {
      v3 = MCSERVER.listenServername;
    } else {
      v3 = MCSERVER.listenServername = TOOLS.pageParameter("listen");
    }
    console.log("definePage:", "#page=" + v1 + "&api=" + v2 + "&listen=" + v3);
    window.location.hash = "#page=" + v1 + "&api=" + v2 + "&listen=" + v3;
  };

  TOOLS.pageParameter = function (pageKey) {
    var hash = window.location.hash;
    var parameter = hash.split("&");
    for (var k in parameter) {
      var z = parameter[k].split("=");
      if (z[0] == pageKey) {
        return z[1];
      }
    }
    return null;
  };

  // 开始监听并打开终端窗口
  TOOLS.listenTerminal = function (serverName) {
    PAGE.methods = 0;
    console.log("模拟终端监听:", serverName);
    MCSERVER.listenServername = PAGE.serverName = serverName;
    WS.sendMsg("server/console/ws", serverName);
    MCSERVER.term.simpleLoadHistory();
    $("#WebTerminalScreenWapper").removeAttr("style");
  };

  // 退出监听实例，停止接受控制台信息
  TOOLS.CloseTerminal = function () {
    WS.sendMsg("server/console/remove", "");
    $("#WebTerminalScreenWapper").css("display", "none");
    MCSERVER.term.clear();
    MCSERVER.term.prompt();
  };
})();
