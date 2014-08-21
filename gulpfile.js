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

var paths = {
    // source
    src: [
        'src/time.js',
        'src/platform/h5/ticker.js',
        'src/platform/h5/pixiRenderContext.js',
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
    unit_test: 'test/unit/**/*.js',
    runner_template: 'test/lib/runner.html',
    runner_lib_dev: [
        'ext/pixi/bin/pixi.dev.js',
        'ext/fire-core/bin/core.dev.js',
        'bin/engine.dev.js',
    ],
    runner_lib_min: [
        'ext/pixi/bin/pixi.js',
        'ext/fire-core/bin/core.min.js',
        'bin/engine.min.js',
    ],

    // output
    output: 'bin/',
    engine_dev: 'engine.dev.js',
    engine_min: 'engine.min.js',

    // generate references
    ref_libs: [
        'ext/pixi/bin/pixi.dev.js',
        'ext/fire-core/bin/core.dev.js',
        'test/lib/*.js',
        'test/unit/_*.js',
    ],
    ref: '_references.js',
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
    return gulp.src(paths.ext_core)
               .pipe(gulp.dest('ext/fire-core/bin'));
});

gulp.task('cp-all', ['cp-core' ] );

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

var embedIntoModule = function (template) {
    var template = fs.readFileSync(template);
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
        //var code = '';
        //for (var i = 0; i < keys.length; i++) {
        //    var key = keys[i];
        //    if (filter(key, m[key])) {
        //        code += 'var ' + key + ' = ' + moduleName + '.' + key + ';\n';
        //    }
        //}
        var code = 
"// declare shortcuts of core\n\
(function () {\n\
    var shortcuts = '" + keys.filter(filter, m).join(',') + "'.split(',');\n\
    for (var i = 0; i < shortcuts.length; i++) {\n\
        this[shortcuts[i]] = " + moduleName + "[shortcuts[i]];\n\
    }\n\
})();\n"
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
               .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'FIRE'))
               .pipe(jshint({
                   multistr: true,
                   smarttabs: false,
               }))
               .pipe(jshint.reporter(stylish))
               .pipe(concat(paths.engine_dev))
               .pipe(embedIntoModule(paths.index))
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

var toFileList = function () {
    var firstFile = null;
    var fileList = [];
    function write(file) {
        if (file.isStream()) return this.emit('error', new PluginError('toFileList', 'Streaming not supported'));
        if (!firstFile) firstFile = file;
        fileList.push(file.relative);
    }
    function end() {
        if (firstFile) {
            firstFile.contents = new Buffer(fileList.join(',') + ',');
        }
        else {
            firstFile = new gutil.File({
                contents: new Buffer(0),
            });
        }
        this.emit('data', firstFile);
        this.emit('end');
    }
    return through(write, end);
};

var trySortByDepends = function (fileList) {
    var indexInSrc = function (filePath) {
        var basename = Path.basename(filePath);
        for (var i = 0; i < paths.src.length; i++) {
            if (Path.basename(paths.src[i]) === basename) {
                return i;
            }
        }
        return -1;
    };
    fileList.sort(function (lhs, rhs) {
        return compare = indexInSrc(lhs) - indexInSrc(rhs);
    });
}

var generateRunner = function (templatePath, dest) {
    var template = fs.readFileSync(templatePath);

    function generateContents(fileList, dev) {
        var scriptElements = '';
        for (var i = 0; i < fileList.length; i++) {
            if (fileList[i]) {
                if (i > 0) {
                    scriptElements += '\r\n    ';
                }
                scriptElements += ('<script src="' + Path.relative(dest, fileList[i]) + '"></script>');
            }
        }
        var data = { file: null, scripts: scriptElements };
        return new Buffer(gutil.template(template, data));
    }
    function write(file) {
        var fileList = file.contents.toString().split(',');
        trySortByDepends(fileList);
        // runner.html
        file.contents = generateContents(paths.runner_lib_min.concat(fileList));
        file.path = Path.join(file.base, Path.basename(templatePath));
        this.emit('data', file);
        // runner.dev.html
        var ext = Path.extname(file.path);
        var filename = Path.basename(file.path, ext) + '.dev' + ext;
        this.emit('data', new gutil.File({
            contents: generateContents(paths.runner_lib_dev.concat(fileList)),
            base: file.base,
            path: Path.join(file.base, filename)
        }));

        this.emit('end');
    }
    return through(write);
};

gulp.task('unit-runner', function() {
    var js = paths.unit_test;
    var dest = paths.unit_test.split('*')[0];
    return gulp.src(js, { read: false, base: './' })
               .pipe(toFileList())
               .pipe(generateRunner(paths.runner_template, dest))
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

gulp.task('ref', ['cp-all'], function() {
    var files = paths.ref_libs.concat(paths.src);
    var destPath = paths.ref;
    var destDir = Path.dirname(destPath);
    return gulp.src(files, { read: false, base: './' })
               .pipe(toFileList())
               .pipe(through(function (file) {
                   function generateContents(fileList) {
                       var scriptElements = '';
                       for (var i = 0; i < fileList.length; i++) {
                           if (fileList[i]) {
                               scriptElements += ('/// <reference path="' + Path.relative(destDir, fileList[i]) + '" />\r\n');
                           }
                       }
                       return new Buffer(scriptElements);
                   }
                   var fileList = file.contents.toString().split(',');
                   file.contents = generateContents(fileList);
                   file.base = destDir;
                   file.path = destPath;
                   this.emit('data', file);
                   this.emit('end');
                }))
               .pipe(gulp.dest(destDir));
});

/////////////////////////////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////////////////////////////

// watch
gulp.task('watch', function() {
    gulp.watch(paths.ext_core, ['cp-3rd']).on ( 'error', gutil.log );
    gulp.watch(paths.src.concat(paths.index), ['js']).on ( 'error', gutil.log );
});

// tasks
gulp.task('default', ['cp-all', 'js' ] );
gulp.task('all', ['default', 'test', 'ref'] );
gulp.task('ci', ['js', 'test'] );
