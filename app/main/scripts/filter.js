'use strict';
angular.module('main')

.filter('i18ng', function($log) {

    return function(val) {
        return t(val);
        // try {
        // } catch (e) {
        //     $log.warn('i18ng: can not translate ' + val);
        //     return val;
        // }
    }
});
