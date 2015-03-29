/**
 * Created by Shaun on 3/27/2015.
 */

register('HomeView', ['./templates/home.html', '$view'], function(home, $view) {
  return function() {
    $view.html(home);
  };
});