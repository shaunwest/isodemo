/**
 * Created by Shaun on 3/28/2015.
 */

register('FooView', ['./templates/foo.html', '$view'], function(foo, $view) {
  return function() {
    $view.html(foo);
  };
});