var https = require('https');
var fs = require('fs');

var express = require('express');
var expressWs = require('..');

var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
var app = express();
var server = https.createServer(options, app);
var expressWs = expressWs(app, server);

app.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

app.get('/', function(req, res, next){
  console.log('get route', req.testing);
  res.end();
});

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
});

server.listen(3000)
