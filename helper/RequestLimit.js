// 请求流量限制器
// 用于限制同一个逻辑请求处的最低请求间隔，限制频繁度

const LimitObject = {};

module.exports.execute = (key, time = 3000) => {
  // 冷却时间未到，禁止执行
  if (LimitObject[key]) return false;
  // 可以执行，重载冷却
  LimitObject[key] = key;
  // 计时开始
  setTimeout(() => {
    LimitObject[key] = null;
  }, time);
  return true;
};
