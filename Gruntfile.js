module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
    compress: {
      zip: {
        options: {
          mode: 'zip',
          archive: 'build/vpause-<%= pkg.version %>.zip'
        },
        expand: true,
        cwd: 'build/src/',
        src: ['**']
      }
    }
  });

//  grunt.loadNpmTasks('grunt-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task(s).
  grunt.registerTask('default', ['copy']);
  grunt.registerTask('zip', [/*'clean',*/'copy', 'compress:zip']);


};