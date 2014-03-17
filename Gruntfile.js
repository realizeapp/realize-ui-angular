/**
 * The Gruntfile defines our build process
 */

module.exports = function ( grunt ) {
  /**
   * Load required Grunt tasks. These are installed based on the versions listed
   * in `package.json` when you do `npm install` in this directory.
   * They are explained further in the taskConfigs section below.
   */
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  // grunt.loadNpmTasks('grunt-bump'); // comment out for now since we aren't using it yet
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-karma');
  // grunt.loadNpmTasks('grunt-ngmin'); // comment out for now since we aren't using it yet
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks("grunt-sync");
  grunt.loadNpmTasks('grunt-connect-proxy');

  // require libs
  var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;
  var pathLib = require('path');
  /**
   * Add params for running our Karma unit and end-to-end tests
   */
  var karmaParams = {};
  karmaParams.plugins = ['karma-mocha']; // add the mocha plugin for BDD & TDD test syntax
  karmaParams.browsers = [];

  // Configure Karma for TravisCI, our continuous integration server.  It only implements Firefox.  See
  // http://stackoverflow.com/questions/19255976/how-to-make-travis-execute-angular-tests-on-chrome-please-set-env-variable-chr
  if (process.env.TRAVIS) {
    karmaParams.plugins.push('karma-firefox-launcher');
    karmaParams.browsers.push('Firefox');
  } else {
    karmaParams.plugins.push('karma-chrome-launcher');
    karmaParams.browsers.push('Chrome');
  }

  /**
   * directoryPaths provides shortcuts used in the rest of this file, to avoid path repetition
   */
  var directoryPaths = {
    src:{
      dirs:{
        bower:'bower_components/',
        app:'src/app/',
        assets:'<%= src.dirs.app %>assets/',
        thirdparty:'<%= src.dirs.app %>thirdparty/',
        widgets:'<%= src.dirs.app %>widgets/' // created by bowercopy
      },
      // requiredFiles are the prerequisites for the app to run
      requiredFiles:[
        '<%= src.dirs.thirdparty %>jquery/jquery.min.js',
        '<%= src.dirs.thirdparty %>lodash/dist/lodash.min.js',
        '<%= src.dirs.thirdparty %>angular/angular.js',
        '<%= src.dirs.thirdparty %>angular-bootstrap/ui-bootstrap-tpls.min.js',
        '<%= src.dirs.thirdparty %>angular-mocks/angular-mocks.js',
        '<%= src.dirs.thirdparty %>angular-touch/angular-touch.min.js',
        '<%= src.dirs.thirdparty %>angular-ui-router/release/angular-ui-router.js',
        '<%= src.dirs.thirdparty %>angular-http-auth/src/http-auth-interceptor.js',
        '<%= src.dirs.thirdparty %>angular-gesture/ngGesture/gesture.js',
        '<%= src.dirs.thirdparty %>angular-ui-utils/modules/utils.js',
        '<%= src.dirs.thirdparty %>restangular/dist/restangular.js',
        '<%= src.dirs.thirdparty %>requirejs/require.js'
        // we aren't using these yet, so comment them out
        // 'd3/d3.min.js',
        // 'd3.chart/d3.chart.min.js',
        // 'Faker/Faker.js',
      ]
    },
    /**
     * The `build.dirs` is where file live during development.
     */
    build:{
      dirs:{
        root:'build/',
        app:'<%= build.dirs.root %>app/',
        widgets:'<%= build.dirs.app %>widgets/',
        thirdparty: '<%= build.dirs.app %>thirdparty/',
        assets:'<%= build.dirs.app %>assets/',
        js:'<%= build.dirs.app %>js/',
        css:'<%= build.dirs.app %>'
      }
    },
    /**
     * `compile.dirs` contains paths to production (i.e., concatenated, minified) files.
     */
    compile:{
      dirs:{
        root:'dist/',
        app:'<%= compile.dirs.root %>app/',
        assets:'<%= compile.dirs.app %>assets/'
      }
    }
  };


  // The taskConfig object contains configurations for the various grunt plugins.
  var taskConfig = {

    // Get the app version from `package.json` to stay DRY
    pkg: grunt.file.readJSON("package.json"),

  /**
   * The banner is the comment that is placed at the top of our compiled
   * source files. It is first processed as a Grunt template, where the `<%=`
   * pairs are evaluated based on this very configuration object.
   */
    banner:
      '/**\n' +
      ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' * <%= pkg.homepage %>\n' +
      ' *\n' +
      ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
      ' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
      ' */\n',

    // bump: {
    // /**
    //  * Increments the version number, etc.  It isn't used yet.
    //  */
    //   options: {
    //     files: ["package.json", "bower.json"],
    //     commit: false,
    //     commitMessage: 'chore(release): v%VERSION%',
    //     commitFiles: ["package.json", "client/bower.json"],
    //     createTag: false,
    //     tagName: 'v%VERSION%',
    //     tagMessage: 'Version %VERSION%',
    //     push: false,
    //     pushTo: 'origin'
    //   }
    // },

    // changelog: {
    // /**
    //  * Creates a changelog on a new version. Not yet used either.
    //  */
    //   options: {
    //     dest: 'CHANGELOG.md',
    //     template: 'changelog.tpl'
    //   }
    // },

    // creates a manifest file for all widgets for the js to request them
    buildWidgetListJSON:{ // adds all our app's css and js files to index.html
      bar:{
        files:[{
          cwd:'<%= src.dirs.app %>',
          src:'widgets/**/*.*',
          dest:'<%= build.dirs.app %>/data/widgetList.json'
        }]
      }
    },

    clean: [
    /**
     * The directories to delete when `grunt clean` is executed.
     */
      '<%= build.dirs.root %>',
      '<%= compile.dirs.root %>'
    ],


    /**
     * The grunt-contrib-connect plugin provides a lightweight web server to view the app
     */

    connect: {
      options: {
        port: 8000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      proxies: [{
        context: '/api/v1/',
        host: 'localhost',
        // headers:{
        //   'Content-Type':'application/json'
        // },
        port: 5000,
        changeOrigin:true,
        https: false
      }],
      livereload: {
        options: {
          base: '<%= build.dirs.app %>',
          middleware: function (connect) {
            return [
              proxySnippet,
              connect.static(pathLib.resolve(grunt.config.get('build.dirs.app')))
            ];
          }
        }
      },
      // test: {
      // },
      compile: {
        options: {
          base: '<%= compile.dirs.app %>'
        }
      }
    },


    /**
     * grunt-contrib-concat concatenates multiple source files into a single file.
     */
    concat: {

      build_index:{ // adds all our app's css and js files to index.html
        src:'<%= src.dirs.app %>index.html',
        dest:'<%= build.dirs.app %>index.html',
        options:{
          process:function(content){ //content, srcpath
            var cssStr = '\n';
            var jsStr = '\n';
            var thirdpartyStr = '    <script type = "text/javascript" src="thirdparty.js"></script>\n';
            // need to think of way to intersperse our test files without mixing concerns, but here seems the most dry
            // since we're already looping and reading each file
            var karmaFiles = [
              'build/app/thirdparty.js',
              'node_modules/chai/chai.js',
              'src/app/thirdparty/angular-mocks/angular-mocks.js'
            ];
            // replace index tokens with appropriate css and js files
            grunt.file.expand(
              {nonull:false,debug:false},
              grunt.config.get('build.dirs.app') + '**/*.{css,js}'
            )
            .forEach(function(path) {
              if(/thirdparty|widgets/.test(path)) {
                return;
              }
              var newStr = path.replace(/.*?\/app\//,'');
              if(/js$/.test(path)){
                // add each js file to our karma files
                karmaFiles.push('build/app/' + newStr);
                // wrap the js with the appropriate tag
                jsStr += '    <script type="text/javascript" src="' + newStr + '"></script>\n';
              } else {
                // wrap the css with the appropriate tag
                cssStr += '    <link rel="stylesheet" type="text/css" href="' + newStr + '" />\n';
              }
            });
            // expand the list of test files and append them to the karma files array
            karmaFiles.push.apply(karmaFiles,grunt.file.expand('src/app/**/*spec.js'));
            // add the karmaFiles array to the Gruntfile karma config
            grunt.config.set('karma.options.files',karmaFiles);
            // add all the js, css, and thirdparty code to index.html
            var newContent = content.replace(/ {4}<\!-- token_replace_css_here -->/i,cssStr);
            return newContent;
          }
        }
      },


      //`compile_css` concatenates our app and thirdparty css in a single file.
      compile_css: {
        src: '<%= build.dirs.app %>**/*.css',
        dest: '<%= compile.dirs.app %><%= pkg.name %>-<%= pkg.version %>.css'
      },
      //`compile_js` concatenates our app and thirdparty js in a single file.
      compile_js: {
        options: { banner: '<%= banner %>' },
        src:['module.prefix','<%= build.dirs.app %>/*.js', '!<%= build.dirs.app %>/thirdparty.js', '<%= build.dirs.widgets %>**/*.js','module.suffix'],
        dest: '<%= compile.dirs.app %><%= pkg.name %>-<%= pkg.version %>.js'
      },
      // build_thirdparty_js combines all our dependencies in a single file in the build dir
      build_thirdparty_js: {
        process:true,
        src:'<%= src.requiredFiles %>',
        dest:'<%= build.dirs.app %>thirdparty.js'
      },
      // compile_thirdparty_js combines all our dependencies in a single file in the compile dir
      compile_thirdparty_js: {
        process:true,
        src:'<%= concat.build_thirdparty_js.dest %>',
        dest:'<%= compile.dirs.app %>thirdparty.js'
      },
      // adds our compiled css and js files to index
      compile_index:{
        src:'<%= src.dirs.app %>index.html',
        dest:'<%= compile.dirs.app %>index.html',
        options:{
          process:function(content){ //content, srcpath
            // since there are only three files now, insert them directly instead of looping like concat.build_index.
            return content
            .replace(
              / {4}<\!-- token_replace_thirdparty_js_here -->/i,
              '    <script type="text/javascript" src="' + grunt.file.expand(grunt.config.get('concat.compile_thirdparty_js.dest'))[0].replace('dist/app/','') + '"></script>\n'
            )
            .replace(
              / {4}<\!-- token_replace_js_here -->/i,
              '    <script type="text/javascript" src="' + grunt.file.expand(grunt.config.get('concat.compile_js.dest'))[0].replace('dist/app/','') + '"></script>\n'
            )
            .replace(
              / {4}<\!-- token_replace_css_here -->/i,
              '    <link rel="stylesheet" type="text/css" href="' + grunt.file.expand(grunt.config.get('concat.compile_css.dest'))[0].replace('dist/app/','') + '" />\n'
            );
          }
        }
      }
    },


    /**
     * ESLint - pluggable code linter that can takes the place of JSHint and JSBeautify.
     * Unfortunately does not lint JSON like JSHint
     */
    eslint: {
      options: {
        // rulesdir: 'conf/rules'            // custom rules
        // format: require('eslint-stylish') // custom formatter
        config: 'eslint.json'        // custom config
      },
      // src_js:{
      //   src:'<%= src.dirs.app %>app.js'
      // },
      // gruntfile:'Gruntfile.js',
      src_js:['<%= src.dirs.app %>**/*.js', '!<%= src.dirs.thirdparty %>**'],
      built_appjs: '<%= build.dirs.js %>app.js',
      built_html_templates: '<%= build.dirs.app %>html_templates_jsfied.js',
      rootfiles: ['Gruntfile.js'], // lints the gruntfile.
      test:['<%= src.dirs.app %>**/*spec.js']
    },

    /**
     * HTML2JS is a Grunt plugin that takes all of your template files and
     * places them into JavaScript files as strings that are added to
     * AngularJS's template cache, so all the html templates join the initial
     * js payload as one JavaScript file.
     */
    html2js: {
      options:{
        module:'html_templates_jsfied',
        base:'<%= src.dirs.app %>'// strips the build dir from the template name
      },
      src_tpls_plus_build_tpls_to_js:{
        src:['<%= src.dirs.app %>**/*.tpl.{html,partial}','!<%= src.dirs.widgets %>**'],
        dest:'<%= build.dirs.app %>html_templates_jsfied.js'
      }
    },



    /**
     * Compiles source documentation into a web page.
     * For valid tags, see http://usejsdoc.org/#JSDoc3_Tag_Dictionary
     * Not implemented yet
     */
    // jsdoc: {
    //   dist : {
    //     src: ['src/*.js', 'test/*.js'],
    //     options: {
    //       destination: 'doc'
    //     }
    //   }
    // },


    jshint: {
    /**
     * lints our JSON files.
     */
      json: ['src/app/**/*.json','*.*rc','!<%= src.dirs.thirdparty %>**'] // lints the rootfiles, bower files, etc.
    },


    /**
     * Karma tests configuration
     */
    karma: {
      options: { // options apply to all tests
        /**
         * basePath: Where to look for files relative to this file's location
         */
        basePath: './',
        /**
         * browsers: The list of browsers to launch to test on. This includes only "Firefox" by
         * default, but other browser names include:
         * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
         *
         * You may also leave this blank and manually navigate your browser to
         * http://localhost:9018/ when you're running tests. The window/tab can be left
         * open and the tests will automatically occur there during the build. This has
         * the aesthetic advantage of not launching a browser every time you save.
         */
        browsers: karmaParams.browsers,

        /**
         * List of file patterns to load into the browser during testing.
         * They get added in concat.build_index
         */
        files: [
          'this-should-get-replaced.js'
        ],
        // list of files to exclude
        exclude:[],
        // which BDD/TDD test framework to use.  Mocha does both.
        frameworks: [ 'mocha' ],
        // leaving this for reference as I implement E2E tests
        // plugins: [ 'karma-jasmine', 'karma-firefox-launcher', 'karma-chrome-launcher', 'karma-phantomjs-launcher' ],
        plugins: karmaParams.plugins,
        port: 9018, // the basic unit test running port
        runnerPort: 9101, // cli runner port - the port the test runner runs on
        urlRoot: '/', // the base path for the browser to use
        autoWatch: false // Disable autowatch since grunt-contrib-watch takes care of it
      },
      unit: { // unit test specific params
        reporters: 'dots',
        background: true // run async to allow other processes to continue
      },
      continuous: {
        singleRun: true // run once - opens a browser, runs the tests, and closes the browser.
      }
    },

    recess: {
    /**
     * `recess` for LESS files concatenates, converts to CSS, copies, and optionally minifies them;
     * Only our `app.less` file is included in compilation.  It must import all other files.
     */
      build: {
        src: [ '<%= src.dirs.app %>app.less' ],
        dest: '<%= build.dirs.css %><%= pkg.name %>-<%= pkg.version %>.css',
        options: {
          compile: true,
          compress: false,
          noUnderscores: false,
          noIDs: true,
          zeroUnits: false
        }
      },
      // the compile phase only adds the compress option
      compile: {
        src: [ '<%= src.dirs.app %>app.less' ],
        dest: '<%= build.dirs.css %><%= pkg.name %>-<%= pkg.version %>.css',
        options: {
          compile: true,
          compress: true,
          noUnderscores: false,
          noIDs: true,
          zeroUnits: false
        }
      }
    },

    /**
     * Copies files from one directory to another.  After first copy, it will only copy changed files
     */
    sync:{
      // copy thirdparty files from bower_components to src/app/thirdparty
      thirdparty_to_src: {
        files: [{
          cwd: '<%= src.dirs.bower %>',
          src: ['**/*.{js,less}','!{happathon,jQuery,node_modules,.git,Gruntfile,gruntfile,gruntFile,bootstrap/js,bootstrap/dist}*/','jQuery/jquery.min.js'],
          dest: '<%= src.dirs.thirdparty %>'
        }]
      },
      // copy over all js/css/html files except thirdparty and tests
      src_js_css_html_to_build:{cwd: '<%= src.dirs.app %>', src:['**/*.{js,css,html}', '!**/*.spec.js'], dest:'<%= build.dirs.app %>'},
      // assets from source to build
      assets:{cwd: '<%= src.dirs.assets %>', src:'**', dest:'<%= build.dirs.assets %>'},
      // assets from source to compile
      compile_assets:{cwd: '<%= src.dirs.assets %>', src:'**', dest:'<%= compile.dirs.assets %>'}
    },

    /**
     * Compress scripts
     */
    uglify: {
      options: {banner: '<%= banner %>'},
      files: {src:'<%= concat.compile_js.dest %>', dest:'<%= concat.compile_js.dest %>'}
    },


    watch: {
     // watches files to see if they change and runs the tasks specified below
     // when they do, automating the build process each time a file is saved.
     // NOTE: These only run on CHANGED files, not creations/deletions
     // Also, the param names mean nothing (e.g., index:, test:, etc...)
      options: {
        cwd:'<%= src.dirs.app %>', // set a default source dir...
        livereload: true // and automatically reload the browser when files change
      },

      //  When a JavaScript unit test file changes, we only want to lint it and
      //  run the unit tests. We don't need to live reload
      test: { files: '<%= src.dirs.app %>**/*.spec.js', tasks: [ 'eslint:test', 'karma:unit:run' ] },
      // When the rootfiles change, lint them.
      rootfiles:{files: ['Gruntfile.js','package.json','bower.json'],tasks:['eslint:rootfiles','build','configureProxies','unit'],options:{cwd:'.'}},
      // compile app's angular dependencies on change
      main_app_module: {files:'app.js', tasks: ['eslint:built_appjs','unit'] },
      angular_modules: {files: ['**/*-module.js'], tasks: ['eslint:src_js','sync:src_js_css_html_to_build','unit'] },
      static_files_excluding_angular_modules:{files: ['**/*.{css,js,html}','!**/*-module.js','!index.html'], tasks: ['sync:src_js_css_html_to_build','unit']},
      // compile index on change
      index: {files: 'index.html', tasks: ['concat:build_index','unit'] },
      // Recompile template cache on change
      compile_partials_to_tpls: {
        files: ['**/*.html'],
        tasks: [
          'html2js',
          'eslint:built_html_templates',
          'concat:build_index',
          'unit'
        ]
      },
      // compile less on change
      appless:{ files: 'app.less', tasks: ['recess:build','unit']},
      // add bootstrap less files
      bootstrapless:{ files: 'thirdparty/bootstrap/**/*.less', tasks: ['recess:build','unit']},
      // Copy any changed assets
      assets:{files:'assets/**', tasks:['sync:assets','unit']}

    }
  };




  // initialize the grunt configuration
  grunt.initConfig( grunt.util._.extend( taskConfig, directoryPaths ) );

  // define a task for our unit tests.  Adding the "run" param since we only use this in watch
  // where karma is already started
  grunt.registerTask( 'unit', ['buildSpec'/*,'karma:unit:run'*/]);

  // Initialize the dev setup - it does a clean build before watching for changes
  grunt.registerTask( 'dev', ['build', 'buildWidgetListJSON', 'configureProxies','connect:livereload', 'watch' ]);


  /** The default task is to build and compile for production */
  grunt.registerTask( 'default', ['build', 'compile']);

  grunt.registerTask( 'fullBuild', ['build', 'buildWidgetListJSON']);

  // The `build` task sets up a dev and testing environment
  grunt.registerTask( 'build', [
    // if this is the first run, it should copy the third party libs servero your thirdparty dir
    !grunt.file.exists(grunt.config.get('src.dirs.thirdparty')) ? // does the thirdparty directory exist in src?
      'sync:thirdparty_to_src' : // nope, create it and populate with fresh bower components
      'clean', // otherwise we're working with an existing install.  Wipe out the build dir for a fresh one.
    'eslint:src_js', // lint src js
    'sync:src_js_css_html_to_build', // copy everything over to the build dir, excluding the things already copied
    'html2js', // compile the html templates to js and place them in the build dir
    'eslint:built_html_templates', // and lint them
    'concat:build_thirdparty_js', // copy third party js & css to build
    'recess:build', // compile our less to css and copy it to the build dir
    'sync:assets', // along with assets
    'concat:build_index', // build our index file with all its dependencies
    'buildSpec', // test our build
    'eslint:test',
    // , // lint our mocha tests
    'karma:unit' // run the unit tests
  ]);

  // The `compile` task preps the app for production by concatenating, minifying, compressing the code.
  grunt.registerTask( 'compile', [
    'recess:compile',
    'sync:compile_assets',
    'concat:compile_thirdparty_js',
    'concat:compile_js',
    'concat:compile_css',
    'concat:compile_index'
    // 'uglify'  compresses the js files - not used yet
  ]);

  // buildSpec tests that our build happened correctly.
  grunt.registerTask('buildSpec','test That all build files that should exist, do',function(){
    if(!grunt.file.exists('build/app/index.html')) {grunt.fail.fatal('index.html does not exist!');}
    if(!grunt.file.exists('build/app/app.js')) {grunt.fail.fatal('app.js does not exist!');}
    if(!grunt.file.exists('build/app/thirdparty.js')) {grunt.fail.fatal('thirdparty js does not exist!');}
    if(!grunt.file.exists('build/app/widgets/')) {grunt.fail.fatal('widgets directory does not exist!');}
    if(!grunt.file.exists('build/app/html_templates_jsfied.js')) {grunt.fail.fatal('html_templates_jsfied does not exist!');}
    // var user = grunt.file.read('build/app/widgets/happathon-engine/mock-backend/people-user-module.js');
    // if(user.indexOf('"name":"happathon-form-daily",') < 0){
    //   grunt.fail.fatal('widgets were not added to user!');
    // }
    // var templateFile = grunt.file.read('build/app/html_templates_jsfied.js');
    // if(templateFile.indexOf('widgets/happathon-insight-utils_angular/all-attributes.tpl.partial') < 0){
    //   grunt.fail.fatal('insight-status plugin not added to template cache via html2js!');
    // }
  });

  grunt.registerMultiTask('buildWidgetListJSON', 'Builds a manifest of json widgets', function() {
      var jsonObj = {};
      var dest = '';
      grunt.file.expand('src/app/widgets/*').forEach(function(dirPath) {

          var widgetName = dirPath.slice(dirPath.lastIndexOf('/') + 1);
          var dirName = "widgets/" + widgetName;
          try{
              var manifest = grunt.file.readJSON(dirPath + "/manifest.json");
              jsonObj[widgetName] = manifest;
              jsonObj[widgetName].dir = dirName + '/';
          } catch(err){
              grunt.log.warn("Error reading manifest file from " + dirPath + " :", err);
          }
      });

      // console.log('jsonObj',jsonObj);
      grunt.file.write('build/app/data/widgetList.json',JSON.stringify(jsonObj));


  });

};
