var express = require('express');
//var mustache = require('mustache-express');
var jsdom = require('jsdom');
var http = require('http');
var routes = require('./public/routes.json');
var kilo = require('kilo');

global.use = kilo.use;
global.register = kilo.register;


var app = express();

/*app.engine('html', mustache());

app.set('view engine', 'html');
app.set('views', __dirname + '/public/templates');
*/
app.use(express.static(__dirname + '/public'));

/*jsdom.env('public/templates/index.html', [], function(errors, win) {
  global.window = win;
  global.document = win.document;

  var main = require('./public/js-src/main');
});

app.get('/', function (req, res) {
  //res.render('index.html');
  res.send(window.document.documentElement.outerHTML);
});*/
function parseResponse (contentType, responseText) {
  if(contentType.substr(0, 16) == 'application/json') {
    return JSON.parse(responseText);
  }
  return responseText;
}

function getHttp (config, cb) {
  var url = config.name;
  if(url.indexOf('/') < 0) {
    cb();
    return;
  }
  if(url.indexOf('./') == 0) {
    url = 'http://localhost:3000/' + url.substr(2);
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
  Injector.handlers[2] = getHttp;
});

routes.forEach(function(route) {
  app.get(route.path, function (req, res) {
    jsdom.env(__dirname + '/public/templates/layout.html', [], function(errors, win) {
      global.window = win;
      global.document = win.document;
      global.$ = require('jquery');

      require('./public/js-src/main');
      require('./public/js-src/home');
      require('./public/js-src/foo');

      global.use(route.module, function(module) {
        module();
        var html = window.document.documentElement.outerHTML;
        res.send(html);
      });
    });
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});