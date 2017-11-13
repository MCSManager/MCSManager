var express = require('express');
var expressWs = require('..')

var expressWs = expressWs(express());
var app = expressWs.app;

app.ws('/a', function(ws, req) {
});
var aWss = expressWs.getWss('/a');

app.ws('/b', function(ws, req) {
});

setInterval(function () {
  aWss.clients.forEach(function (client) {
    client.send('hello');
  });
}, 5000);

app.listen(3000)
