var gulp = require('gulp');
var less = require('gulp-less');
var del = require('del');
const zip = require('gulp-zip');
var gulpSequence = require('gulp-sequence');

gulp.task('build', gulpSequence(['clean', 'copy', 'zip']));

gulp.task('clean', function(cb) {
  return del('build/src/*', cb);
});

gulp.task('copy', function(cb) {

  // todo add clean first
  return gulp.src([
    '_locales/**/*',
    'css/**/*',
    'img/**/*',
    'js/**/*',
    'manifest.json',
    'options.html',
  ],{ "base" : "." })
    .pipe(gulp.dest('./build/src/'))
});

gulp.task('zip', function(cb) {
  return gulp.src('./build/src/**')
    .pipe(zip('vpause.zip'))
    .pipe(gulp.dest('build'))
});

gulp.task('watch', function(){
  gulp.watch(['js/*'], ['copy']);
  // Other watchers
});


