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

import Koa from "koa";

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 400;
  ctx.body = "错误请求：请求参数不正确";
}

// Type check
function check(taget: any, parameter: any) {
  if (taget) {
    for (const key in parameter) {
      const typeVal = parameter[key];

      if (taget[key] == null || taget[key] === "") return false;

      if (typeVal === Number) {
        taget[key] = Number(taget[key]);
        if (isNaN(taget[key])) return false;
        continue;
      }

      if (typeVal === String) {
        taget[key] = String(taget[key]);
        continue;
      }

      if (typeVal === Date) {
        const r = new Date(taget[key]).toString();
        if (r == "Invalid Date" || r == null) return false;
        taget[key] = new Date(taget[key]);
        continue;
      }

      if (typeVal === Array) {
        if (!(taget[key] instanceof Array)) {
          const object = JSON.parse(taget[key]);
          if (!(object instanceof Array)) return false;
          taget[key] = object;
        }
      }

      if (typeVal === Object) {
        if (!taget[key]) return false;
        // const object = JSON.parse(taget[key]);
        // taget[key] = object;
      }
    }
    return true;
  }
  return false;
}

// Entry function
export = function (parameter: any) {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    try {
      let checkBool = true;
      if (parameter["params"] && !check(ctx.params, parameter["params"])) checkBool = false;
      if (parameter["query"] && !check(ctx.query, parameter["query"])) checkBool = false;
      if (parameter["body"] && !check(ctx.request.body, parameter["body"])) checkBool = false;
      if (checkBool) return await next();
      return verificationFailed(ctx);
    } catch (err) {
      const error: Error = err;
      ctx.status = 500;
      ctx.body = `${error.message}`;
    }
  };
};
