// Copyright (C) 2022 MCSManager Team <mcsmanager-dev@outlook.com>

// @Entity
export default class SystemConfig {
  // HTTP 服务端口与IP
  httpPort: number = 23333;
  httpIp: string = null;

  // 数据传输端口
  dataPort: number = 23334;

  // 分布式转发模式
  forwardType: number = 1;

  // 是否准许跨域请求
  crossDomain: boolean = false;
  // 是否采用 Gzip 压缩 HTTP 返回信息
  gzip: boolean = false;
  // 最大同时压缩任务
  maxCompress: number = 1;
  // 最大同时下载任务
  maxDonwload: number = 10;
  // 解压缩实现形式
  zipType: number = 1;
  // 登录次数IP限制
  loginCheckIp: boolean = true;
  // 登录界面文案
  loginInfo: string = "";
  // 是否对普通用户开启文件管理功能
  canFileManager = true;
}
