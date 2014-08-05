var Path = require('path');
var es = require('event-stream');
var stylish = require('jshint-stylish');
var fs = require('fs');

var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var qunit = require('gulp-qunit');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var paths = {
    src: [
        'src/test.js',
    ],
    index: 'src/index.js',
    
    ext_core: [ 
        '../core/bin/**/*.js',
    ],

    output: 'bin/',
    engine_dev: 'engine.dev.js',
    engine_min: 'engine.min.js',
};

// clean
gulp.task('clean', function() {
    return gulp.src(output + '*', { read: false })
               .pipe(clean());
});

/////////////////////////////////////////////////////////////////////////////
// copy
/////////////////////////////////////////////////////////////////////////////

gulp.task('cp-core', function() {
    var dest = 'ext/fire-core';
    return gulp.src(paths.ext_core)
               .pipe(gulp.dest(dest));
});

gulp.task('cp-all', ['cp-core' ] );

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

var delcareFireScope = function (template) {
    var template = fs.readFileSync(template);
    return es.map(function(file, callback) {
        var data = { file: file, contents: file.contents };
        file.contents = new Buffer(gutil.template(template, data));
        callback(null, file);
    });
};

gulp.task('js-dev', function() {
    return gulp.src(paths.src)
               .pipe(jshint())
               .pipe(jshint.reporter(stylish))
               .pipe(uglify())
               .pipe(concat(paths.engine_dev))
               .pipe(delcareFireScope(paths.index))
               .pipe(gulp.dest(paths.output))
               ;
});

gulp.task('js', ['js-dev'], function() {
    return gulp.src(Path.join(paths.output, paths.engine_dev))
               .pipe(uglify())
               .pipe(rename(paths.engine_min))
               .pipe(gulp.dest(paths.output))
               ;
});

/////////////////////////////////////////////////////////////////////////////
// test
/////////////////////////////////////////////////////////////////////////////

gulp.task('test', ['js'], function() {
    return gulp.src('test/unit/**/*.html')
               .pipe(qunit())
               .on('error', function(err) {
                   // Make sure failed tests cause gulp to exit non-zero
                   throw err;
               })
               ;
});

/////////////////////////////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////////////////////////////

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-core']).on ( 'error', gutil.log );
    gulp.watch(paths.src.concat(paths.index), ['js-dev']).on ( 'error', gutil.log );
});

// tasks
gulp.task('dev', ['cp-all', 'js-dev' ] );
gulp.task('default', ['cp-all', 'js' ] );
gulp.task('all', ['default', 'test'] );
