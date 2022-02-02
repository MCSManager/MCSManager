/*
  Copyright (C) 2022 Suwings(https://github.com/Suwings)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  According to the GPL, it is forbidden to delete all copyright notices, 
  and if you modify the source code, you must open source the
  modified source code.

  版权所有 (C) 2022 Suwings(https://github.com/Suwings)

  本程序为自由软件，你可以依据 GPL 的条款（第三版或者更高），再分发和/或修改它。
  该程序以具有实际用途为目的发布，但是并不包含任何担保，
  也不包含基于特定商用或健康用途的默认担保。具体细节请查看 GPL 协议。

  根据协议，您必须保留所有版权声明，如果修改源码则必须开源修改后的源码。
  前往 https://mcsmanager.com/ 申请闭源开发授权或了解更多。
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
