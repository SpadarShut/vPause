'use strict';

const gulp = require('gulp'),
    del = require('del'),
    zip = require('gulp-zip'),
    gulpSequence = require('gulp-sequence'),
    args = require('yargs').argv,
    uglify = require('gulp-uglify'),
    pump = require('pump'),
    jsonMinify = require('gulp-json-minify'),
    cleanCSS = require('gulp-clean-css'),
    imagemin = require('gulp-imagemin'),
    htmlmin = require('gulp-htmlmin'),
    manifest = require('./source/manifest.json');

let shouldCompress = args.z;

gulp.task('uglify:js', cb => {
    pump([
            gulp.src('source/js/*.js'),
            uglify(),
            gulp.dest('build/unpacked/js')
        ],
        cb
    );
});

gulp.task('uglify:json', cb => {
    gulp.src('source/_locales/**/*.json')
        .pipe(jsonMinify())
        .pipe(gulp.dest('build/unpacked/_locales'));

    cb();
});

gulp.task('uglify:manifest', cb => {
    gulp.src('source/*.json')
        .pipe(jsonMinify())
        .pipe(gulp.dest('build/unpacked'));

    cb();
});

gulp.task('minify:css', cb => {
    gulp.src('source/css/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('build/unpacked/css'));

    cb();
});

gulp.task('minify:images', cb => {
    gulp.src('source/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('build/unpacked/img'));

    cb();
});

gulp.task('minify:html', cb => {
    gulp.src('source/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('build/unpacked'));

    cb();
});

gulp.task('clean', cb => {
    del(['build/unpacked/**', 'build/*.zip']).then(() => {
        cb();
    });
});

gulp.task('archive', cb => {
    gulp.src('build/unpacked/*')
        .pipe(zip('vPause-' + manifest.version + '.zip'))
        .pipe(gulp.dest('build'));

    cb();
});

gulp.task('compress', gulpSequence(
    'clean',
    ['uglify:js', 'uglify:json', 'uglify:manifest'],
    ['minify:css','minify:images', 'minify:html']
));

function calculateBuildTasks () {
    shouldCompress = shouldCompress || false;

    if( shouldCompress ) {
        return gulpSequence('compress', 'archive');
    } else {
        return gulpSequence('compress');
    }
}

gulp.task('build', calculateBuildTasks());
