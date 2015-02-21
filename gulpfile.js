var Path = require('path');
var es = require('event-stream');
var stylish = require('jshint-stylish');
var fs = require('fs');
var through = require('through');

var gulp = require('gulp');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var qunit = require('gulp-qunit');
var rename = require('gulp-rename');
var uglify = require('gulp-uglifyjs');
var preprocess = require('gulp-preprocess');

var fb = require('gulp-fb');
var del = require('del');

var paths = {
    // source
    src: [
        // runtime pre-defines
        'src/platform/editor/asset-watcher.js',
        'src/platform/editor/editor-callbacks.js',
        // runtime engine
        'src/definition.js',
        'src/time.js',
        'src/event/event.js',
        'src/event/event-listeners.js',
        'src/event/event-target.js',
        'src/platform/h5/ticker.js',
        'src/platform/h5/pixi-render-context.js',
        'src/bitmapfont/pixi-bitmap-font-util.js',
        'src/platform/h5/loaders.js',
        'src/component/component.js',
        'src/component/transform.js',
        'src/component/renderer.js',
        'src/component/sprite-renderer.js',
        "src/bitmapfont/bitmap-text.js",
        'src/component/camera.js',
        'src/component/missing.js',
        'src/interaction-context.js',
        'src/entity.js',
        'src/scene.js',
        'src/load-manager.js',
        'src/asset-library.js',
        'src/platform/h5/engine.js',
        'src/platform/h5/input-events.js',
        'src/platform/h5/input-context.js',
        'src/event/event-register.js',
        'src/input.js',
    ],
    index: 'src/index.js',

    // ext
    ext_core: '../core/bin/**/core.js',

    // test
    test: {
        src: 'test/unit/**/*.js',
        runner: 'test/lib/runner.html',
        lib_dev: [
            'ext/pixi/bin/pixi.dev.js',
            'ext/fire-core/bin/dev/core.js',
            'bin/dev/engine.js',
        ],
        lib_min: [
            'ext/pixi/bin/pixi.js',
            'ext/fire-core/bin/min/core.js',
            'bin/min/engine.js',
        ],
    },

    // output
    output: 'bin/',
    output_dev: 'bin/dev/',
    output_min: 'bin/min/',
    engine_dev: 'engine.js',
    engine_min: 'engine.js',
    engine_player_dev: 'engine.player.dev.js',
    engine_player: 'engine.player.js',

    // references
    ref: {
        src: [
            'ext/pixi/bin/pixi.dev.js',
            'ext/fire-core/bin/dev/core.js',
            'test/lib/*.js',
            'test/unit/_*.js',
        ],
        dest: '_references.js',
    },
};

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
        if (file.isStream()) return this.emit('error', new gutil.PluginError('insertCoreShortcut', 'Streaming not supported'));
        if (!finished) {
            var shortcut = file.clone();
            shortcut.contents = new Buffer(createShortcut(path, moduleName, filter));
            this.emit('data', shortcut);
            finished = true;
        }
        this.emit('data', file);
    }
    return through(write);
};

gulp.task('js-dev', function() {
    return gulp.src(paths.src)
               // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
               .pipe(jshint({
                   multistr: true,
                   smarttabs: false,
                   loopfunc: true,
               }))
               .pipe(jshint.reporter(stylish))
               .pipe(concat(paths.engine_dev))
               .pipe(embedIntoModule(paths.index))
               .pipe(preprocess({context: { EDITOR: true, DEBUG: true, DEV: true }}))
               .pipe(gulp.dest(paths.output_dev))
               ;
});

gulp.task('js-min', function() {
    return gulp.src(paths.src)
    // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_min))
        .pipe(embedIntoModule(paths.index))
        .pipe(preprocess({context: { EDITOR: true, DEV: true }}))
        .pipe(uglify({
            compress: {
                dead_code: false,
                unused: false
            }
        }))
        .pipe(gulp.dest(paths.output_min))
        ;
});

gulp.task('js-player-dev', function() {
    return gulp.src(paths.src.concat('!**/{Editor,editor}/**'))
        // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_player_dev))
        .pipe(embedIntoModule(paths.index))
        .pipe(preprocess({context: { PLAYER: true, DEBUG: true, DEV: true }}))
        .pipe(gulp.dest(paths.output))
        ;
});

gulp.task('js-player', function() {
    return gulp.src(paths.src.concat('!**/{Editor,editor}/**'))
        // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_player))
        .pipe(embedIntoModule(paths.index))
        .pipe(preprocess({context: { PLAYER: true }}))
        .pipe(gulp.dest(paths.output))
        ;
});

gulp.task('js-all', ['js-dev', 'js-min', 'js-player-dev', 'js-player']);

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

gulp.task('test', ['cp-core', 'js-min', 'unit-runner'], function() {
    gutil.log("please run " + gutil.colors.green("'bower install'") + " before running this task.");
    var timeOutInSeconds = 5;
    return gulp.src('test/unit/runner.html', { read: false })
               //.pipe(fb.callback(function () {
               //    // launch server
               //    require('./test/server.js');
               //}))
               .pipe(qunit({ timeout: timeOutInSeconds }))
               //.on('error', function(err) {
               //    // Make sure failed tests cause gulp to exit non-zero
               //    throw err;
               //})
               ;
});

/////////////////////////////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////////////////////////////

// clean
gulp.task('clean', function() {
    del('bin/');
});

// ref
gulp.task('ref', ['cp-core'], function() {
    var files = paths.ref.src.concat(paths.src);
    var destPath = paths.ref.dest;
    return fb.generateReference(files, destPath);
});

// watch
gulp.task('watch', function() {
    gulp.watch(paths.src.concat(paths.index), ['default']).on ( 'error', gutil.log );
});

// tasks
gulp.task('min', ['js-min', 'js-player-dev', 'js-player']);
gulp.task('dev', ['js-dev', 'js-player-dev', 'js-player']);
gulp.task('all', ['dev', 'test', 'ref'] );
gulp.task('ci', ['test'] );
gulp.task('default', ['dev', 'min']);
