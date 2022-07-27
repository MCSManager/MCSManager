/*
  Copyright (C) 2022 https://github.com/mcsmanager team.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.
*/

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
