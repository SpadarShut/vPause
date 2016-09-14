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
    manifest = require('./source/manifest.json'),
    async = require('async'),
    path = require('path'),
    packageFile = require('./package.json'),
    jetpack = require('fs-jetpack');

let shouldCompress = args.z;

gulp.task('uglify:js', cb => {
    pump([
        gulp.src('source/js/*.js'),
        uglify(),
        gulp.dest('build/unpacked/js')
    ], cb);
});

gulp.task('uglify:json', cb => {
    pump([
        gulp.src('source/_locales/**/*.json'),
        jsonMinify(),
        gulp.dest('build/unpacked/_locales')
    ], cb);
});

gulp.task('uglify:manifest', cb => {
    pump([
        gulp.src('source/*.json'),
        jsonMinify(),
        gulp.dest('build/unpacked')
    ], cb);
});

gulp.task('minify:css', cb => {
    pump([
        gulp.src('source/css/*.css'),
        cleanCSS(),
        gulp.dest('build/unpacked/css')
    ], cb);
});

gulp.task('minify:images', cb => {
    pump([
        gulp.src('source/img/*'),
        imagemin(),
        gulp.dest('build/unpacked/img')
    ], cb);
});

gulp.task('minify:html', cb => {
    pump([
        gulp.src('source/*.html'),
        htmlmin({ collapseWhitespace: true }),
        gulp.dest('build/unpacked')
    ], cb);
});

gulp.task('clean', cb => {
    del(['build/unpacked/**', 'build/*.zip']).then(() => {
        cb();
    });
});

gulp.task('archive', cb => {
    pump([
        gulp.src('**', { cwd: path.join(process.cwd(), '/build/unpacked/') }),
        zip('vPause-' + manifest.version + '.zip'),
        gulp.dest('build')
    ], cb);
});

gulp.task('archive:opera', cb => {
    pump([
        gulp.src('**', { cwd: path.join(process.cwd(), '/source/') }),
        zip('vPause-' + manifest.version + '.nex'),
        gulp.dest('build')
    ], cb);
});

gulp.task('compress', gulpSequence(
    'clean',
    ['uglify:js', 'uglify:json', 'uglify:manifest'],
    ['minify:css','minify:images', 'minify:html']
));

function calculateBuildTasks () {
    shouldCompress = shouldCompress || false;

    syncVersion();

    if( shouldCompress ) {
        return gulpSequence('compress', ['archive', 'archive:opera']);
    } else {
        return gulpSequence('compress');
    }
}

function syncVersion() {
    async.map(['source/manifest.json', 'source/options.html'], changeFile, err => {
        if( err ) console.error(err);
    });
}

function changeFile(item, callback) {
    let file = jetpack.read(item);

    switch (item) {
        case 'source/options.html' :
            file = file.replace(/<h1 class="page-title">(.*?)<\/h1>/, `<h1 class="page-title">vPause ${packageFile.version}<\/h1>`);
            break;
        case 'source/manifest.json' :
            file = JSON.parse(file);
            file.version = packageFile.version;
            break;
    }

    jetpack.write(item, file);

    callback(null); //no error handling, of course :)
}

gulp.task('build', calculateBuildTasks());
