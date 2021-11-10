// 针对API返回的数据缩写的服务模块

class NullError extends Error {
  constructor() {
    super(null);
  }
}

class ForbiddenError extends Error {
  constructor() {
    super("权限不足 | Forbidden");
  }
}

class UnavailableError extends Error {
  constructor() {
    super("请求频繁，拒绝服务 | Service Unavailable");
  }
}

module.exports.send = (res, data = "", statusCode = 200) => {
  res.send(
    JSON.stringify({
      status: statusCode,
      data: data,
    })
  );
  res.end();
};

module.exports.ok = (res, statusCode = 200) => {
  res.send(
    JSON.stringify({
      status: statusCode,
    })
  );
  res.end();
};

module.exports.error = (res, error = new NullError(), statusCode = 500) => {
  res.send(
    JSON.stringify({
      status: statusCode,
      error: error.message,
    })
  );
  res.end();
};

module.exports.forbidden = (res, error = new ForbiddenError(), statusCode = 403) => {
  res.send(
    JSON.stringify({
      status: statusCode,
      error: error.message,
    })
  );
  res.end();
};

module.exports.unavailable = (res, error = new UnavailableError(), statusCode = 503) => {
  res.send(
    JSON.stringify({
      status: statusCode,
      error: error.message,
    })
  );
  res.end();
};

module.exports.key = (req) => {
  return req.query.apikey || "";
};
