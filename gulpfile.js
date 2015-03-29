/**
 * Created by Shaun on 3/24/2015.
 */

var gulp = require('gulp');
var path = require('path');
var nodemon = require('gulp-nodemon');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var tap = require('gulp-tap');
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

gulp.task('clean-lib', function() {
  return gulp.src('./public-dev/js-lib', {read: false})
    .pipe(clean());
});

gulp.task('make-lib', ['clean-lib'], function() {
  return gulp.src(jsLib)
    .pipe(gulp.dest('./public-dev/js-lib'));
});

gulp.task('inject', ['make-lib', 'make-js-manifest'], function() {
  var target = gulp.src('./public-dev/index.html');
  var sources = gulp.src(['./public-dev/js-lib/**/*.js', './public-dev/js/**/*.js'], {read: false});

  return target.pipe(inject(sources, {relative: true}))
    .pipe(gulp.dest('./public-dev'));
});

gulp.task('make-js-manifest', function() {
  return gulp.src(['./public-dev/js/**/*.js'], {read: false})
    .pipe(tap(function(file, t) {
      console.log(path.basename(file.path));
    }));
  // need to write file
});

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
  nodemon({ script: 'server.js', ext: 'js html', ignore: [] })
    .on('restart', function () {
      console.log('restarted!')
    });
});