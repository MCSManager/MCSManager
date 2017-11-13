var express = require('express');
var expressWs = require('..');

var expressWs = expressWs(express());
var app = expressWs.app;

app.param('world', function (req, res, next, world) {
  req.world = world || 'world';
  return next();
});

app.get('/hello/:world', function(req, res, next){
  console.log('hello', req.world);
  res.end();
  next();
});

app.ws('/hello/:world', function(ws, req, next) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket hello', req.world);
  next();
});

app.listen(3000)
