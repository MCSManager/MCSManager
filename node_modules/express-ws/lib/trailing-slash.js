'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addTrailingSlash;
function addTrailingSlash(string) {
  var suffixed = string;
  if (suffixed.charAt(suffixed.length - 1) !== '/') {
    suffixed = suffixed + '/';
  }
  return suffixed;
}