/**
 * Created by Shaun on 3/29/2015.
 */

register('HeaderView', ['./templates/header.html', '$header'], function(header, $header) {
  return function() {
    $header.html(header);
  };
});