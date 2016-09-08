var gulp = require('gulp'),
    runSequence = require('run-sequence').use(gulp),
    $fn = require('gulp-load-plugins')({ camelize: true }),
    plumberErrorHandler = {
        errorHandler: $fn.notify.onError({
            title: 'Gulp',
            message: 'Error: <%= error.message %>'
        })
    },
    pkg = require('./package.json');

//region JavaScript
gulp.task('js', ['js:vendor'], function() {
    return gulp.src('assets/js/src/*.js')
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.jshint())
        .pipe($fn.jshint.reporter('default'))
        .pipe(gulp.dest('assets/js'))
        .pipe($fn.uglify())
        .pipe($fn.rename({extname: '.min.js'}))
        .pipe(gulp.dest('assets/js'))
        .pipe($fn.notify({
            message: 'JS task complete',
            onLast: true
        }))
        .pipe($fn.livereload());
});
gulp.task('js:vendor', function() {
    return gulp.src('assets/js/src/vendor/*.js')
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe(gulp.dest('assets/js/vendor'))
        .pipe($fn.uglify())
        .pipe($fn.rename({extname: '.min.js'}))
        .pipe(gulp.dest('assets/js/vendor'))
        .pipe($fn.notify({
            message: 'JS Vendor task complete',
            onLast: true
        }))
        .pipe($fn.livereload());
});
//endregion JavaScript

//region Language Files
gulp.task('langpack', function () {
    return gulp.src(['**/*.php', '!build/**/*.*'])
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.sort())
        .pipe($fn.wpPot( {
            domain: pkg.name,
            bugReport: 'https://wprecipemanager.com/support',
            team: 'Recipe Manager for WP <support@wprecipemanager.com>'
        } ))

        .pipe(gulp.dest('languages'))
        .pipe($fn.notify({
            message: 'Language files task complete',
            onLast: true
        }));
});
//endregion Language Files

//region SASS & CSS
gulp.task('css', function() {
    return gulp.src('assets/sass/*.scss')
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.sourcemaps.init())
        .pipe($fn.sass({
            errLogToConsole: true,
            outputStyle: 'expanded',
            precision: 10
        }))
        .pipe($fn.sourcemaps.write())
        .pipe($fn.sourcemaps.init({
            loadMaps: true
        }))
        .pipe($fn.autoprefixer('last 5 version', '> 1%', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe($fn.sourcemaps.write('.'))
        .pipe($fn.plumber.stop())
        .pipe(gulp.dest('assets/css'))
        .pipe($fn.filter('**/*.css')) // Filtering stream to only css files
        .pipe($fn.combineMq()) // Combines Media Queries
        .pipe($fn.livereload())
        .pipe($fn.rename({ suffix: '.min' }))
        .pipe($fn.csso({
            //sourceMap: true,
        }))
        .pipe(gulp.dest('assets/css'))
        .pipe($fn.livereload())
        .pipe($fn.notify({
            message: 'Styles task complete',
            onLast: true
        }))
        .pipe(gulp.dest('assets/css'));
});
//endregion SASS & CSS

//region Cleaners
gulp.task('clean-js', ['clean-js:vendor'], function () {
    return gulp.src(['assets/js/*.js'], {read: false})
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.clean());
});
gulp.task('clean-js:vendor', function () {
    return gulp.src(['assets/js/vendor/*.js'], {read: false})
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.clean());
});
gulp.task('clean-css', function () {
    return gulp.src(['assets/css/*.css', 'assets/css/*.css.map'], {read: false})
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.clean());
});
gulp.task('clean-build', function () {
    return gulp.src('build/*', {read: false})
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.clean());
});
gulp.task('clean-package', function () {
    return gulp.src('release/'+pkg.name+'_v'+pkg.version+'.zip', {read: false})
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.clean({force: true}));
});

// Cleaning Routines
gulp.task('clean-all', function (done) {
    runSequence(
        ['clean-js', 'clean-css'],
        ['clean-build', 'clean-package'],
        done
    );
});
//endregion Cleaners

//region Watch & Build
gulp.task('watch', function () {
    $fn.livereload.listen();
    gulp.watch('assets/sass/**/*.scss', ['css']);
    gulp.watch(['assets/js/src/**/*.js'], ['js']);
    gulp.watch('**/*.php', ['langpack']);
});

// Cleans & Rebuilds Assets Prior to Builds
gulp.task('prebuild', function (done) {
    runSequence(
        'clean-all',
        ['css', 'js', 'langpack'],
        done
    );
});

// Copies a clean set of build files into the build folder
gulp.task('build', ['prebuild'], function () {
    return gulp.src(['./**/*.*', '!./build/**', '!./release/**', '!./node_modules/**', '!./gulpfile.js', '!./package.json', '!./assets/js/src/**'])
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe(gulp.dest('build/'+pkg.name));
});

// Generates a release package with the current version from package.json
gulp.task('package', ['clean-package'], function () {
    return gulp.src('build/**/*.*')
        .pipe($fn.plumber(plumberErrorHandler))
        .pipe($fn.zip(pkg.name+'_v'+pkg.version+'.zip'))
        .pipe(gulp.dest('release'));
});

// Runs all build routines and generates a release.
gulp.task('release', function (done) {
    runSequence(
        'build',
        'package',
        done
    );
});

// Runs a releaes and cleans up afterwards.
gulp.task('release:clean', ['release'], function (done) {
    runSequence(
        'clean-build',
        done
    );
});
//endregion Watch & Build

gulp.task('default', function (done) {
    runSequence(
        'prebuild',
        'watch',
        done
    );
});


