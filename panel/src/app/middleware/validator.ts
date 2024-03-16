import Koa from "koa";

// Failed callback
function verificationFailed(ctx: Koa.ParameterizedContext) {
  ctx.status = 400;
  ctx.body = "Request parameters are incorrect";
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

interface IParam {
  params?: any;
  query?: any;
  body?: any;
}

// Entry function
export default function (parameter: IParam) {
  return async (ctx: Koa.ParameterizedContext, next: Function) => {
    try {
      let checkBool = true;
      if (parameter["params"] && !check(ctx.params, parameter["params"])) checkBool = false;
      if (parameter["query"] && !check(ctx.query, parameter["query"])) checkBool = false;
      if (parameter["body"] && !check(ctx.request.body, parameter["body"])) checkBool = false;
      if (checkBool) return await next();
      return verificationFailed(ctx);
    } catch (err: any) {
      const error: Error = err;
      ctx.status = 500;
      ctx.body = `${error.message}`;
    }
  };
}
