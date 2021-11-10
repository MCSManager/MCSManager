(function () {
  // 菜单 数据
  MCSERVER.meumObject = {};

  //非管理员
  MCSERVER.meumObject.notMasterMeum = [
    {
      class: "glyphicon-home", //html元素 类
      name: "用户中心", //菜单名
      link: "./template/gen_home.html", //单击时跳转目的
      api: "genuser/home", //通过 Webscoket 后端请求的API,null为不请求,
      select: true,
    },
    {
      class: "glyphicon-th-list", //html元素 类
      name: "文件管理", //菜单名
      link: "./template/filemanager.html", //单击时跳转目的
      api: "genuser/home", //通过 Webscoket 后端请求的API,null为不请求,
      select: false,
    },
    {
      class: "glyphicon-equalizer",
      name: "关于",
      link: "./template/gen_about.html",
      api: null,
      select: false,
    },
  ];

  //管理员的
  //注意，这些页面只能管理员访问，普通用户就算访问，也得不到任何数据
  MCSERVER.meumObject.masterMeum = [
    {
      class: "glyphicon-equalizer",
      name: "面板数据总览",
      link: "./template/center.html",
      api: "center/show",
      select: false,
    },
    {
      class: "glyphicon-tasks",
      name: "服务端管理",
      link: "./template/server.html",
      api: "server/view",
      select: false,
    },
    {
      class: "glyphicon-th-large",
      name: "用户管理",
      link: "./template/userset.html",
      api: "userset/update",
      select: false,
    },
    {
      class: "glyphicon-th-list",
      name: "文件管理",
      link: "./template/filemanager.html",
      api: "genuser/home",
      select: false,
    },
    {
      class: "glyphicon-floppy-open",
      name: "服务",
      link: "./template/feelback.html",
      api: null,
      select: false,
    },
  ];
})();
