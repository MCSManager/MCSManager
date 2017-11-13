'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = websocketUrl;

var _trailingSlash = require('./trailing-slash');

var _trailingSlash2 = _interopRequireDefault(_trailingSlash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* The following fixes HenningM/express-ws#17, correctly. */
function websocketUrl(url) {
  if (url.indexOf('?') !== -1) {
    var _url$split = url.split('?'),
        _url$split2 = _slicedToArray(_url$split, 2),
        baseUrl = _url$split2[0],
        query = _url$split2[1];

    return (0, _trailingSlash2.default)(baseUrl) + '.websocket?' + query;
  }
  return (0, _trailingSlash2.default)(url) + '.websocket';
}