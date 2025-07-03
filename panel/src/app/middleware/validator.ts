import Koa from "koa";

// Type check
function check(target: any, parameter: any) {
  if (target) {
    for (const key in parameter) {
      const typeVal = parameter[key];

      if (target[key] == null || target[key] === "")
        throw new Error(`Validator failed: "${key}" is required!`);

      if (typeVal === Number) {
        target[key] = Number(target[key]);
        if (isNaN(target[key])) throw new Error(`Validator failed: "${key}" is not a number`);
        continue;
      }

      if (typeVal === String) {
        target[key] = String(target[key]);
        continue;
      }

      if (typeVal === Date) {
        const r = new Date(target[key]).toString();
        if (r == "Invalid Date" || r == null)
          throw new Error(`Validator failed: "${key}" is not a date`);
        target[key] = new Date(target[key]);
        continue;
      }

      if (typeVal === Array) {
        if (!(target[key] instanceof Array)) {
          const object = JSON.parse(target[key]);
          if (!(object instanceof Array))
            throw new Error(`Validator failed: "${key}" is not an array`);
          target[key] = object;
        }
        continue;
      }

      if (typeVal === Object) {
        if (!target[key]) throw new Error(`Validator failed: "${key}" is not an object`);
        continue;
      }
    }
    return true;
  }
  throw new Error("target is null");
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
      parameter["params"] && check(ctx.params, parameter["params"]);
      parameter["query"] && check(ctx.query, parameter["query"]);
      parameter["body"] && check(ctx.request.body, parameter["body"]);
      return await next();
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = `${err.message || "Request parameters are incorrect"}`;
    }
  };
}
