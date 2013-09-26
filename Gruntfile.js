module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    default: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: '/*/*',
        dest: '/build/*/*'
      }
    },
    clean: {
      src: 'build/**'
    },
    copy: {

      main: {
          expand: true,
          src: ['_locales/**', 'css/**', 'img/**', 'js/**', 'options.html', 'manifest.json'],
          dest: 'build/src'
      }
    },
    zip: {
      zip: {
        cwd: 'build/src/',
        src: 'build/src/**',
        dest: 'build/vpause-<%= pkg.version %>.zip'
      }
    }
  });

//  grunt.loadNpmTasks('grunt-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-zip');

  // Default task(s).
  grunt.registerTask('default', 'default', [/*'clean',*/'copy', 'zip:zip']);


};