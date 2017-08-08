'use strict';

var gulp = require("gulp");
var clean = require("gulp-clean");
var connect = require("gulp-connect");
var proxy = require("http-proxy-middleware");
var sass = require("gulp-sass");

gulp.task('clean', function () {
    return gulp.src('./dist', { read: false })
        .pipe(clean());
});

gulp.task('sass', ['clean'], function () {
    return gulp.src('./src/css/sass/*.scss')
        .pipe(sass({
            outputStyle: 'nested',
            errLogToConsole: true
        }))
        .pipe(gulp.dest('./src/css/'));
});

gulp.task('copy', ['sass'], function () {
    var filesToMove = [
        './src/*.html',
        './src/css/*.css',
        './src/js/*.js',
        './src/thirdparty/**'
    ];

    return gulp.src(filesToMove, { base: './src/' }).pipe(gulp.dest('./dist'));
});

gulp.task('serve', ['copy'], function () {
    connect.server({
        root: "./dist",
        port: 20001,
        livereload: true,
        middleware: function (connect, options) {

            var p1 = proxy('/demo', {
                target: "http://13.13.13.82:8080/",
            });

            return [p1];
        }
    });
});