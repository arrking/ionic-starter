'use strict';
angular.module('main')
    .constant('Config', {

        // gulp environment: injects environment vars
        // https://github.com/mwaylabs/generator-m-ionic#gulp-environment
        ENV: {
            /*inject-env*/
            'host': 'mdt-server.mybluemix.net'
            /*endinject*/
        },

        // gulp build-vars: injects build vars
        // https://github.com/mwaylabs/generator-m-ionic#gulp-build-vars
        BUILD: {
            /*inject-build*/
            /*endinject*/
        }

    });
