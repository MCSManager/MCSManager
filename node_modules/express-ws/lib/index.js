'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = expressWs;

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _websocketUrl = require('./websocket-url');

var _websocketUrl2 = _interopRequireDefault(_websocketUrl);

var _addWsMethod = require('./add-ws-method');

var _addWsMethod2 = _interopRequireDefault(_addWsMethod);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function expressWs(app, httpServer) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var server = httpServer;

  if (server === null || server === undefined) {
    /* No HTTP server was explicitly provided, create one for our Express application. */
    server = _http2.default.createServer(app);

    app.listen = function serverListen() {
      var _server;

      return (_server = server).listen.apply(_server, arguments);
    };
  }

  /* Make our custom `.ws` method available directly on the Express application. You should
   * really be using Routers, though. */
  (0, _addWsMethod2.default)(app);

  /* Monkeypatch our custom `.ws` method into Express' Router prototype. This makes it possible,
   * when using the standard Express Router, to use the `.ws` method without any further calls
   * to `makeRouter`. When using a custom router, the use of `makeRouter` may still be necessary.
   *
   * This approach works, because Express does a strange mixin hack - the Router factory
   * function is simultaneously the prototype that gets assigned to the resulting Router
   * object. */
  if (!options.leaveRouterUntouched) {
    (0, _addWsMethod2.default)(_express2.default.Router);
  }

  // allow caller to pass in options to WebSocketServer constructor
  var wsOptions = options.wsOptions || {};
  wsOptions.server = server;
  var wsServer = new _ws2.default.Server(wsOptions);

  wsServer.on('connection', function (socket) {
    var request = socket.upgradeReq;

    request.ws = socket;
    request.wsHandled = false;

    /* By setting this fake `.url` on the request, we ensure that it will end up in the fake
     * `.get` handler that we defined above - where the wrapper will then unpack the `.ws`
     * property, indicate that the WebSocket has been handled, and call the actual handler. */
    request.url = (0, _websocketUrl2.default)(request.url);

    var dummyResponse = new _http2.default.ServerResponse(request);

    dummyResponse.writeHead = function writeHead(statusCode) {
      if (statusCode > 200) {
        /* Something in the middleware chain signalled an error. */
        socket.close();
      }
    };

    app.handle(request, dummyResponse, function () {
      if (!request.wsHandled) {
        /* There was no matching WebSocket-specific route for this request. We'll close
         * the connection, as no endpoint was able to handle the request anyway... */
        socket.close();
      }
    });
  });

  return {
    app: app,
    getWss: function getWss() {
      return wsServer;
    },
    applyTo: function applyTo(router) {
      (0, _addWsMethod2.default)(router);
    }
  };
} /* This module does a lot of monkeypatching, but unfortunately that appears to be the only way to
   * accomplish this kind of stuff in Express.
   *
   * Here be dragons. */