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

import axios from "axios";

const st = new Date().toLocaleDateString();

// 此功能模块用于 MCSManager 用户数据统计，目的是了解现有日活数量与安装数量。
// 用户统计将不会发送任何隐私数据，用户数据，系统信息等。
// 详情参考：https://mcsmanager.com/agreement.html
async function statistics() {
  return await axios.get("http://statistics.mcsmanager.com/", {
    params: {
      st
    },
    timeout: 1000 * 10
  });
}

// 请求 24 小时内只有一次算有效统计，重复请求忽略不计
// 这里设置为 24 小时请求一次
setTimeout(async () => {
  try {
    return await statistics();
  } catch (error) {
    // ignore
  }
}, 1000 * 60 * 60 * 24);

// 面板启动时进行统计一次
statistics()
  .then(() => {})
  .catch(() => {});
