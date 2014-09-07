var Path = require('path');
var es = require('event-stream');
var stylish = require('jshint-stylish');
var fs = require('fs');
var through = require('through');

var gulp = require('gulp');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var qunit = require('gulp-qunit');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var fb = require('gulp-fb');

var paths = {
    // source
    src: [
        'src/time.js',
        'src/platform/h5/ticker.js',
        'src/platform/h5/pixiRenderContext.js',
        'src/platform/h5/loaders.js',
        'src/component/component.js',
        'src/component/transform.js',
        'src/component/spriteRenderer.js',
        'src/entity.js',
        'src/scene.js',
        'src/platform/h5/engine.js',
    ],
    index: 'src/index.js',

    // ext
    ext_core: '../core/bin/**/*.js',

    // test
    test: {
        src: 'test/unit/**/*.js',
        runner: 'test/lib/runner.html',
        lib_dev: [
            'ext/pixi/bin/pixi.dev.js',
            'ext/fire-core/bin/core.dev.js',
            'bin/engine.dev.js',
        ],
        lib_min: [
            'ext/pixi/bin/pixi.js',
            'ext/fire-core/bin/core.min.js',
            'bin/engine.min.js',
        ],
    },

    // output
    output: 'bin/',
    engine_dev: 'engine.dev.js',
    engine_min: 'engine.min.js',

    // references
    ref: {
        src: [
            'ext/pixi/bin/pixi.dev.js',
            'ext/fire-core/bin/core.dev.js',
            'test/lib/*.js',
            'test/unit/_*.js',
        ],
        dest: '_references.js',
    },
};

// clean
gulp.task('clean', function() {
    return gulp.src(output + '*', { read: false })
               .pipe(clean());
});

/////////////////////////////////////////////////////////////////////////////
// copy
/////////////////////////////////////////////////////////////////////////////

// copy local core to ext for rapid test
gulp.task('cp-core', function() {
    return gulp.src(paths.ext_core, { base: '../core' })
               .pipe(gulp.dest('ext/fire-core'));
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

var embedIntoModule = function (template) {
    template = fs.readFileSync(template);
    return es.map(function(file, callback) {
        var data = { file: file, contents: '\n\n' + file.contents.toString() };
        file.contents = new Buffer(gutil.template(template, data));
        callback(null, file);
    });
};

var insertCoreShortcut = function (path, moduleName, filter) {
    var finished = false;
    filter = filter || function (key) {
        return this[key].prototype && this[key].prototype.__classname__;
    };
    function createShortcut(path, moduleName, filter) {
        var m = require(path);
        var keys = Object.getOwnPropertyNames(m);
        var code = '';

        if ('readable') {
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (filter.call(m, key)) {
                    code += 'var ' + key + ' = ' + moduleName + '.' + key + ';\n';
                }
            }
        }
        else {
            code =
"// declare shortcuts of core\n\
(function () {\n\
    var shortcuts = '" + keys.filter(filter, m).join(',') + "'.split(',');\n\
    for (var i = 0; i < shortcuts.length; i++) {\n\
        this[shortcuts[i]] = " + moduleName + "[shortcuts[i]];\n\
    }\n\
})();\n";
        }
        return code;
    }
    function write(file) {
        if (file.isStream()) return this.emit('error', new PluginError('insertCoreShortcut', 'Streaming not supported'));
        if (!finished) {
            var shortcut = file.clone();
            shortcut.contents = new Buffer(createShortcut(path, moduleName, filter));
            this.emit('data', shortcut);
            finished = true;
        }
        this.emit('data', file);
    }
    return through(write, function () {
        this.emit('end');
    });
};

gulp.task('js-dev', function() {
    return gulp.src(paths.src)
               // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'FIRE'))
               .pipe(jshint({
                   multistr: true,
                   smarttabs: false,
               }))
               .pipe(jshint.reporter(stylish))
               .pipe(concat(paths.engine_dev))
               .pipe(embedIntoModule(paths.index))
               .pipe(jshint.reporter(stylish))
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

gulp.task('unit-runner', function() {
    var js = paths.test.src;
    var dest = paths.test.src.split('*')[0];
    return gulp.src(js, { read: false, base: './' })
               .pipe(fb.toFileList())
               .pipe(fb.generateRunner(paths.test.runner,
                                         dest,
                                         'Fire Engine Test Suite',
                                         paths.test.lib_min,
                                         paths.test.lib_dev,
                                         paths.src))
               .pipe(gulp.dest(dest))
               ;
});

gulp.task('test', ['js', 'unit-runner'], function() {
    return gulp.src('test/unit/runner.html')
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

// ref
gulp.task('ref', ['cp-core'], function() {
    var files = paths.ref.src.concat(paths.src);
    var destPath = paths.ref.dest;
    return fb.generateReference(files, destPath);
});

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-3rd']).on ( 'error', gutil.log );
    gulp.watch(paths.src.concat(paths.index), ['js']).on ( 'error', gutil.log );
});
gulp.task('watch-self', function() {
    gulp.watch(paths.src.concat(paths.index), ['js']).on ( 'error', gutil.log );
});

// tasks
gulp.task('default', ['js' ] );
gulp.task('all', ['default', 'test', 'ref'] );
gulp.task('ci', ['js', 'test'] );
