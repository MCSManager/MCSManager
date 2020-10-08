/* eslint-disable no-prototype-builtins */

const observerMask = {};
const CALLBACK = "CALLBACK";
const CALLBACK_NAME = "CALLBACK_NAME";
const FUNCTION_END = "__FUNCTI0N_END__";

module.exports.FUNCTION_END = FUNCTION_END;

//监听
module.exports.listener = function (event, _callbackName, _callback) {
  let callbackName = "";
  let callback = null;
  if (_callback != undefined) {
    callbackName = _callbackName;
    callback = _callback;
  } else {
    callback = _callbackName;
  }
  let callbackConfig = {};
  callbackConfig[CALLBACK_NAME] = callbackName;
  callbackConfig[CALLBACK] = callback;

  if (observerMask.hasOwnProperty(event)) {
    observerMask[event].push(callbackConfig);
    return true;
  }
  observerMask[event] = [callbackConfig];
  return false;
};

//触发
module.exports.emit = function (event, msg) {
  if (observerMask.hasOwnProperty(event)) {
    for (var i in observerMask[event]) {
      let returnV = observerMask[event][i][CALLBACK](msg);
      if (returnV && returnV === FUNCTION_END) {
        //如果函数返回 FUNCTION_END，移除监听
        delete observerMask[event][i][CALLBACK];
        delete observerMask[event][i];
      }
    }
    return true;
  }
  return false;
};

//移除监听
module.exports.remove = function (event, callbackName) {
  if (observerMask.hasOwnProperty(event)) {
    for (var i in observerMask[event]) {
      if ((observerMask[event][i][CALLBACK_NAME] = callbackName)) {
        delete observerMask[event][i][CALLBACK];
        delete observerMask[event][i];
        return true;
      }
    }
  }
  return false;
};
