'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addWsMethod;

var _wrapMiddleware = require('./wrap-middleware');

var _wrapMiddleware2 = _interopRequireDefault(_wrapMiddleware);

var _websocketUrl = require('./websocket-url');

var _websocketUrl2 = _interopRequireDefault(_websocketUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function addWsMethod(target) {
  /* This prevents conflict with other things setting `.ws`. */
  if (target.ws === null || target.ws === undefined) {
    target.ws = function addWsRoute(route) {
      for (var _len = arguments.length, middlewares = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        middlewares[_key - 1] = arguments[_key];
      }

      var wrappedMiddlewares = middlewares.map(_wrapMiddleware2.default);

      /* We append `/.websocket` to the route path here. Why? To prevent conflicts when
       * a non-WebSocket request is made to the same GET route - after all, we are only
       * interested in handling WebSocket requests.
       *
       * Whereas the original `express-ws` prefixed this path segment, we suffix it -
       * this makes it possible to let requests propagate through Routers like normal,
       * which allows us to specify WebSocket routes on Routers as well \o/! */
      var wsRoute = (0, _websocketUrl2.default)(route);

      /* Here we configure our new GET route. It will never get called by a client
       * directly, it's just to let our request propagate internally, so that we can
       * leave the regular middleware execution and error handling to Express. */
      this.get.apply(this, _toConsumableArray([wsRoute].concat(wrappedMiddlewares)));

      /*
       * Return `this` to allow for chaining:
       */
      return this;
    };
  }
}