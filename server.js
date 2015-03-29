var express = require('express');
var jsdom = require('jsdom');
var http = require('http');
var fs = require('fs');
var publicDir = __dirname + '/public-dev';
var routes = require(publicDir + '/routes.json');
var kilo = require('kilo');

global.use = kilo.use;
global.register = kilo.register;

var app = express();

app.use(express.static(publicDir));

function parseResponse (contentType, responseText) {
  if(contentType.substr(0, 16) == 'application/json') {
    return JSON.parse(responseText);
  }
  return responseText;
}

function getFile (config, cb) {
  var url = config.name;
  if(url.indexOf('/') < 0) {
    cb();
    return;
  }
  if(url.indexOf('./') == 0) {
    fs.readFile(publicDir + '/' + url.substr(2), {encoding: 'utf8'}, function(err, data) {
      if(err) throw err;
      cb(data, 200);
    });
    return;
  }
  var req = http.request(url, function(res) {
    var data = '';

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      data += chunk;
    });

    res.on('end', function() {
      console.log(data);
      var contentType = res.headers['content-type'] || '';
      (res.statusCode >= 300) ? cb() :
        cb(parseResponse(contentType, data), res.statusCode);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    console.log('URL: ' + url);
  });

  req.end();
}

global.use('Injector', function(Injector) {
  Injector.handlers[2] = getFile;
});

function initLayout(path, cb) {
  jsdom.env(path, [], function(errors, win) {
    global.window = win;
    global.document = win.document;
    global.use = kilo.use;
    global.register = kilo.register;
    cb();
  });
}

function initClient() {
  global.$ = require('jquery');
  require(publicDir + '/js/main');
  require(publicDir + '/js/header');
  require(publicDir + '/js/home');
  require(publicDir + '/js/foo');
}

function initRoutes() {
  routes.forEach(function(route) {
    app.get(route.path, function (req, res) {
      global.use(route.module, function (module) {
        module();
        res.send(global.window.document.documentElement.outerHTML);
      });
    });
  });
}

function startServer() {
  var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
  });
  return server;
}

initLayout(publicDir + '/index.html', function() {
  initClient();
  initRoutes();
});

startServer();
