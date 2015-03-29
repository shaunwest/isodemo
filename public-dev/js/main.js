/**
 * Created by Shaun on 3/28/2015.
 */

// Register libraries
register.lib('$', $.noConflict());

// Add interceptors
use(['Injector', '$'], function(Injector, $) {
  Injector.addInterceptor(/\$(.*)/, function(element) {
    return $(element);
  });
});

use('HeaderView')();
