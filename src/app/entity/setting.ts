/*
  Copyright (C) 2022 Suwings <Suwings@outlook.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  According to the AGPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings <Suwings@outlook.com>

  该程序是免费软件，您可以重新分发和/或修改据 GNU Affero 通用公共许可证的条款，
  由自由软件基金会，许可证的第 3 版，或（由您选择）任何更高版本。

  根据 AGPL 与用户协议，您必须保留所有版权声明，如果修改源代码则必须开源修改后的源代码。
  可以前往 https://mcsmanager.com/ 阅读用户协议，申请闭源开发授权等。
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
}
