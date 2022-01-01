/*
 * @Author: Copyright 2021 Suwings
 * @Date: 2021-08-30 10:09:26
 * @LastEditTime: 2021-08-30 10:15:51
 * @Description: MCSManager 面板网页数据源，此文件目的是您提供最新的官方信息
 */

// 正常性在线数据
function onlineMCSManagerNotice() {
  var content = {
    "version": "9.0.0 公开测试版",
    "version2": "1.0.0 公开测试版",
    "notice": [
      {
        "title": "MCSManager 9.0 公开测试版将于2021年1月1日正式发布！",
        "info": "新版本采用 Typescript 作为后端语言且90%的功能全部重写或重构，测试版不会公布在 GitHub（目的是为了防止所有人都下载测试版使用），暂时采用压缩包下载的方式提供测试使用，后续会逐渐开源。欢迎有兴趣的朋友尝鲜。"
      },
      {
        "title": "MCSManager 9.0 测试版已发布",
        "info": "新版本采用 Typescript 作为后端语言且90%的功能全部重写或重构，测试版不会公布在 GitHub（目的是为了防止所有人都下载测试版使用），暂时采用压缩包下载的方式提供测试使用，后续会逐渐开源。欢迎有兴趣的朋友尝鲜。"
      },
      {
        "title": "关于如何反馈问题的通知",
        "info": "现在版本我们需要收集大量的意见反馈，请加QQ群287215485参与反馈讨论，或者发送邮件至 Suwings@outlook.com 写明问题内容。"
      },
      {
        "title": "关于商业使用的通知",
        "info": "相信已经有少许服务商使用 MCSManager 面板进行出租，但是旧版本在设计之初并未完全考虑到商业出租等需求，主要还是方便个人为主。新版本将尽可能提高商业活动的价值，但是测试版并不具备商业价值。"
      },
      {
        "title": "关于旧版本的维护计划",
        "info": "在新版本发布后，8.6.x版本将进行最后一次更新，修复一些bug且不新增任何功能，便不再继续更新8.x版本。如果你有众多数据需要迁移到新版本暂时还无法做到，后续会考虑写一些批量转换脚本帮助你将数据迁移到新版本。"
      },
    ],
    "news": [
      {
        "title": "MCSManager 9.0 公开测试版将于2021年1月1日正式发布！",
        "info": "新版本采用 Typescript 作为后端语言且90%的功能全部重写或重构，测试版不会公布在 GitHub（目的是为了防止所有人都下载测试版使用），暂时采用压缩包下载的方式提供测试使用，后续会逐渐开源。欢迎有兴趣的朋友尝鲜。"
      },
      {
        "title": "MCSManager 9.0 第二次测试版已发布",
        "info": "为了促进用爱发电与减少测试版的大规模使用，MCSM 9版本只限于赞助人员体验，您只需赞助最低10元即可体验到测试版。所有赞助人员名单将在以后加入到面板中，每一个控制面板用户都将能看见你的名字。",
        "time": "2021年10月4日"
      },
      {
        "title": "官方网站上线啦！",
        "info": "我们制作了一个临时的地址用于 MCSManager 9 版本的官方网站和官方文档，欢迎大家访问：http://api.mcsmanager.com/mcsm9/",
        "time": "2021年10月2日"
      },
      {
        "title": "MCSManager 9 将在今年年底前发布，更多的扩展性，更强的稳定性！",
        "info": "MCSManager 面板（简称：MCSM 面板）是一款全中文，轻量级，开箱即用，多实例和支持 Docker 的 Minecraft 服务端管理面板。",
        "time": "2021年10月1日"
      },
      {
        "title": "旧版本迁移",
        "info": "两者版本数据文件差异过大，无法直接升级迁移。如果您已经形成自己的产品链或部署一切正常，可以不必考虑迁移升级到 MCSManager 9 版本，您依然可以继续使用 MCSManager 8 版本。",
        "time": "2021年9月20日"
      }
    ],
    "helpLink": [
      {
        "title": "官方 WIKI/操作指南",
        "link": "https://github.com/Suwings/MCSManager/wiki"
      },
      {
        "title": "反馈问题或提供建议",
        "link": "https://github.com/Suwings/MCSManager/issues"
      },
      {
        "title": "MCSManager 8 API 文档",
        "link": "https://github.com/Suwings/MCSManager/wiki/API-Documentation"
      },
      {
        "title": "MCSManager 9 API 文档",
        "link": "https://docs.mcsmanager.com/#/"
      }
    ],
    "faq": [
      {
        "title": "常见问题或常见解决方案",
        "link": "https://github.com/Suwings/MCSManager/discussions/455"
      },
      {
        "title": "你希望 MCSManager 9.0 新增哪些功能？",
        "link": "https://github.com/Suwings/MCSManager/discussions/455"
      }
    ]
  }
  return JSON.parse(JSON.stringify(content));
}


// 紧急事件通知
function onlineEmergencyNotice() {
  return null
}