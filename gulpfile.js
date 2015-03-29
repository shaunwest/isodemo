/**
 * Created by Shaun on 3/24/2015.
 */

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var karma = require('karma').server;
var runSequence = require('run-sequence');
var clean = require('gulp-clean');
var inject = require('gulp-inject');
var karmaConfig = __dirname + '/karma.conf.js';
var jsLib = [
  './node_modules/jquery/dist/jquery.js',
  './node_modules/kilo/kilo.js',
  './node_modules/page/page.js'
];

var jsApp = [];

var serverSources = [
];

gulp.task('clean', function() {
  return gulp.src('public/js', {read: false})
    .pipe(clean());
});

gulp.task('build', function() {
  return gulp.src(jsLib)
    .pipe(gulp.dest('public/js-src/lib'));
});

/*gulp.task('inject', function() {
  var target = gulp.src('./public/index.html');
  var sources = gulp.src(jsSources, {read: false});

  return target.pipe(inject(sources))
    .pipe(gulp.dest('./src'));
});*/

/*gulp.task('build-prod', function() {
  return gulp.src(jsSources)
    .pipe(concat('sprite-web.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(uglify())
    .pipe(rename('sprite-web.min.js'))
    .pipe(gulp.dest('public/js'));
});*/

/*gulp.task('build-server', function() {
  return gulp.src(serverSources)
    .pipe(concat('sprite-server.js'))
    .pipe(gulp.dest('.'));
});*/

gulp.task('test', function(cb) {
  return karma.start({
    configFile: karmaConfig,
    singleRun: true
  }, cb);
});

gulp.task('watch', function() {
  return gulp.watch('src/**/*.js', ['build']);
});

gulp.task('ci', function(cb) {
  return karma.start({
    configFile: karmaConfig
  }, cb);
});

gulp.task('default', function(cb) {
  runSequence('clean', 'build', 'watch', cb);
});

gulp.task('prod', function(cb) {
  runSequence('test', 'clean', 'prod-build', cb);
});

gulp.task('serve', function () {
  nodemon({ script: 'index.js', ext: 'js html', ignore: [] })
    .on('restart', function () {
      console.log('restarted!')
    });
});