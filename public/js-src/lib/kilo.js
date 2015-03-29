/**
 * Created by Shaun on 3/11/2015.
 *
 */

(function() {
  'use strict';

  var id = 'kilo',
    EMPTY_NAMESPACE = '_',
    WILD_CARD = '*',
    types = ['Array', 'Object', 'Boolean', 'Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'];

  var Util = {
    isDefined: function (value) { return typeof value != 'undefined' },
    def: function (value, defaultValue) { return (typeof value == 'undefined') ? defaultValue : value },
    error: function (message) { throw new Error(id + ': ' + message) },
    warn: function (message) { Util.log('Warning: ' + message) },
    log: function (message) { if(config.log) { console.log(id + ': ' + message) } },
    argsToArray: function (args) { return Array.prototype.slice.call(args) },
    rand: function (max, min) { // move to extra?
      min = min || 0;
      if(min > max) { Util.error('rand: invalid range.'); }
      return Math.floor((Math.random() * (max - min + 1))) + (min);
    }
  };

  for(var i = 0; i < types.length; i++) {
    Util['is' + types[i]] = (function(type) {
      return function(obj) {
        return Object.prototype.toString.call(obj) == '[object ' + type + ']';
      };
    })(types[i]);
  }

  function parseName (key) {
    var lastIndex = key.lastIndexOf('.');
    return (lastIndex > -1 && key.indexOf('/') < 0) ?
      key.substr(lastIndex + 1) : key;
  }

  function parseNs (key) {
    var lastIndex = key.lastIndexOf('.');
    return (key.indexOf('/') < 0 && lastIndex > -1) ?
      key.substr(0, lastIndex) : EMPTY_NAMESPACE;
  }

  function getInjector () {
    var registered = {_: {}},
      interceptors = [];

    function getInterceptor (matchString) {
      var matches;
      for(var i = 0; i < interceptors.length; i++) {
        var interceptor = interceptors[i];
        if(matches = matchString.match(interceptor.pattern)) {
          return {name: matches[1], cb: interceptor.cb};
        }
      }
      return {name: matchString};
    }

    function getNsObject(nsList, name) {
      var i = 0;
      while(i < nsList.length) {
        var nsObject = registered[nsList[i++]];
        if(nsObject && (name == WILD_CARD || nsObject[name])) {
          return nsObject;
        }
      }
    }

    function getNamespace(nsInfo, cb) {
      var name = nsInfo.name;
      var nsObject = getNsObject(nsInfo.nsList, name);

      if(!nsObject) {
        cb();
        return;
      }

      if(name == WILD_CARD) {
        var nsItems = [];
        for(var key in nsObject) {
          if(key !== nsInfo.ignore) {
            nsItems.push(nsObject[key]);
          }
        }
        resolveNamespace(nsItems, cb, {});
        return;
      }

      if(!nsObject[name]) {
        cb();
        return;
      }
      resolveNamespace([nsObject[name]], function(result) {
        cb(result[name]);
      }, {});
    }

    function apply(func, args) {
      return func.apply(Injector, args);
    }

    function resolveNamespace(nsItems, cb, result) {
      var nsItem = nsItems.shift();
      if(!nsItem) {
        cb(result);
        return;
      }
      if(!nsItem.resolved) {
        resolve(nsItem.deps.slice(0), function(args) {
          result[nsItem.name] = nsItem.resolved = apply(nsItem.func, args);
          resolveNamespace(nsItems, cb, result);
        }, [], nsItem.ns, nsItem.name);
        return;
      }
      result[nsItem.name] = nsItem.resolved;
      resolveNamespace(nsItems, cb, result);
    }

    function resolve (deps, cb, args, ns, ignore) {
      if(!deps) {
        cb();
        return;
      }
      var dep = deps.shift();
      if(!dep) {
        cb(args);
        return;
      }
      var parsedNs = parseNs(dep);
      var nsList = (parsedNs == EMPTY_NAMESPACE) ?
        [ns, EMPTY_NAMESPACE] : [parsedNs, ns, EMPTY_NAMESPACE];
      var interceptor = getInterceptor(parseName(dep));

      getDependency({nsList: nsList, name: interceptor.name, ignore: ignore}, Injector.handlers.slice(0), function(result) {
        if(interceptor.cb) {
          result = interceptor.cb(result);
        }
        args.push(result);

        resolve(deps, cb, args, ns, ignore);
      });
    }

    function getDependency (depInfo, handlers, cb) {
      var handler = handlers.shift();
      if (!handler) {
        cb();
        return;
      }
      handler(depInfo, function (result) {
        if (result) {
          cb(result);
          return;
        }
        getDependency(depInfo, handlers, cb);
      });
    }

    var Injector = {
      register: function (key, depsOrFunc, func) {
        if (Util.isFunction(depsOrFunc)) {
          func = depsOrFunc;
          depsOrFunc = [];
        }
        var ns = parseNs(key);
        var name = parseName(key);
        if (!registered[ns]) {
          registered[ns] = {};
        }
        registered[ns][name] = {
          ns: ns,
          name: name,
          deps: depsOrFunc,
          func: func,
          resolved: null
        };
        return this;
      },
      use: function (depsOrFunc, func) {
        var module;

        // one dependency
        if (Util.isString(depsOrFunc)) {
          depsOrFunc = [depsOrFunc];
        }
        // multiple dependencies
        if (!Util.isArray(depsOrFunc)) {
          return;
        }
        // not async
        if (!func) {
          return function() {
            var args1 = arguments;
            setTimeout(function() {
              resolve(depsOrFunc.slice(0), function (args) {
                if(Util.isFunction(args[0])) {
                  apply(args[0], args1);
                }
              }, []);
            }, 1);
          };
        }
        // async
        setTimeout(function() {
          resolve(depsOrFunc.slice(0), function(args) {
            apply(func, args);
          }, []);
        }, 1);
      },
      add: function(name, value, ns) {
        ns = ns || EMPTY_NAMESPACE;
        registered[ns][name] = {ns: ns, name: name, resolved: value};
        return this;
      },
      unresolve: function(name, ns) {
        ns = ns || EMPTY_NAMESPACE;
        if(registered[ns] && registered[ns][name]) {
          registered[ns][name].resolved = null;
        }
        return this;
      },
      addInterceptor: function(pattern, cb) {
        interceptors.push({pattern: pattern, cb: cb});
        return this;
      },
      handlers: [getNamespace, getElement, getHttp]
    };

    Injector.register.lib = Injector.add;

    return Injector;
  }

  function parseResponse (contentType, responseText) {
    if(contentType.substr(0, 16) == 'application/json') {
      return JSON.parse(responseText);
    }
    return responseText;
  }

  function getHttp (config, cb, contentType) {
    var url = config.name;
    if(url.indexOf('/') < 0) {
      cb();
      return;
    }
    var req = new XMLHttpRequest();

    req.onerror = function() {
      Util.error('Network error.');
    };

    req.onload = function() {
      var contentType = contentType || this.getResponseHeader('content-type') || '';
      (this.status >= 300) ? cb() :
        cb(parseResponse(contentType, this.responseText), this.status);
    };

    req.open('get', url, true);
    req.send();
  }

  function findElements (container) {
    container = (container) ?
      container.querySelectorAll('*') : document.getElementsByTagName('html');
    if(!container[0]) {
      return;
    }
    return container[0].querySelectorAll('*');
  }

  // TODO: perf
  function getElement (config, cb, container) {
    var elementId = config.name,
      results = [],
      elements = findElements(container);

    if(!elements){
      cb();
      return;
    }

    var bracketIndex = elementId.indexOf('[]');
    if(bracketIndex > -1) {
      elementId = elementId.substring(0, bracketIndex);
    }
    for(var i = 0, numElements = elements.length; i < numElements; i++) {
      var element = elements[i];
      if(element.hasAttribute('data-' + elementId)) {
        results.push(element);
      }
    }
    (bracketIndex == -1) ?
      cb(results[0]) : cb((results.length == 0) ? undefined : results);
  }

  var config = {
    log: true
  };

  var Injector = getInjector();
  Injector
    .add('Injector', Injector)
    .add('Util', Util)
    .add('config', config)
    .add('element', function(elementId, cb, container) {
      getElement({name: elementId}, cb, container);
    });

  if(typeof exports != 'undefined') {
    exports['register'] = Injector.register;
    exports['use'] = Injector.use;
  } else {
    if(!window.register) window.register = Injector.register;
    if(!window.use) window.use = Injector.use;
  }
})();