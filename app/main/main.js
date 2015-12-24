angular.module('main', [
    'ionic',
    'ngCordova',
    'ui.router',
    'ngStorage'
    // TODO: load other modules selected during generation
])

.run(function($ionicPlatform, $timeout, $rootScope, $state, $log, store, webq, Socketio, $q, ntm, Config) {
    $ionicPlatform.ready(function() {

        // start socket io for get pushed data
        Socketio.start();
        $log.debug('init: get config ' + JSON.stringify(Config));

        $q.when()
            .then(function() {
                $log.debug('init: resolve context.');
                var context = {};
                if (window.isMobile.iOS()) {
                    context.isIOS = true;
                    context.isAndroid = false;
                } else if (window.isMobile.Android()) {
                    context.isIOS = false;
                    context.isAndroid = true;
                } else {
                    context.isIOS = false;
                    context.isAndroid = false;
                }

                if (window.isMobile.Wechat()) {
                    context.isWechat = true;
                } else {
                    context.isWechat = false;
                }

                if (window.isMobile.Macintosh()) {
                    context.isMac = true;
                } else {
                    context.isMac = false;
                }

                if (window.cordova) {
                    context.isCordova = true;
                } else {
                    context.isCordova = false;
                }
                return context;
            }).then(function(context) {
                $log.debug('init: resolve language, locale.');
                var deferred = $q.defer();
                if (context.isCordova) {
                    navigator.globalization.getPreferredLanguage(
                        function(language) {
                            context['preferredLanguage'] = language;
                            if (_.indexOf(['en', 'en-US', 'en-CN'], language.value) == -1) {
                                context['lang'] = 'en-US';
                            } else {
                                context['lang'] = 'dev';
                            }
                            deferred.resolve(context);
                        },
                        function() {
                            $log.error('Error getting language\n');
                            // set default locale as Chinese
                            context['lang'] = 'dev';
                            deferred.resolve(context);
                        }
                    );
                } else {
                    context['lang'] = 'dev';
                    deferred.resolve(context);
                }
                return deferred.promise;
            })
            .then(function(context) {
                // init i18next
                $log.debug('init: i18next.');
                var deferred = $q.defer();
                window.i18n.init({
                    lng: context.lang, // If not given, i18n will detect the browser language.
                    fallbackLng: 'dev', // Default is dev, using Chineses for dev
                    useCookie: false,
                    useLocalStorage: false,
                    resGetPath: 'main/assets/locales/__lng__/__ns__.json'
                }, function(tFunction) {
                    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                    // for form inputs)
                    window.t = tFunction;
                    deferred.resolve(context);
                });

                return deferred.promise;
            })
            .then(function(context) {
                $log.debug('init: resolve token.');
                context['token'] = store.getToken();
                if (context.isCordova) {
                    context['has_network'] = ntm.getNetwork();
                } else {
                    // set network as true for uncordova environment
                    context['has_network'] = 1;
                }
                return context;
            })
            .then(function(context) {
                $log.debug('init: resolve state');
                var deferred = $q.defer();
                if (context.token && context.has_network) {
                    $log.debug('init: resolve user profile.');
                    webq.getUserProfile()
                        .then(function(data) {
                            $log.debug('profile data', data);
                            store.setUserProfile(data);
                            context['state'] = 'main.home';
                        }, function(err) {
                            $log.error('can not get profile data ', err);
                            context['state'] = 'login';
                        })
                        .finally(function() {
                            deferred.resolve(context);
                        });
                } else {
                    // no network or token, get to login page
                    $log.debug('init: resolve login page.');
                    context['state'] = 'login';
                    deferred.resolve(context);
                }
                return deferred.promise;
            })
            .then(function(context) {
                $log.debug('init: enhance UX with cordova plugins.');
                var deferred = $q.defer();
                if (context.isCordova) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                    if (context.state === 'login') {
                        // org.apache.cordova.statusbar required
                        StatusBar.overlaysWebView(true);
                        StatusBar.styleLightContent();
                        StatusBar.backgroundColorByName('white');
                        StatusBar.hide();
                        deferred.resolve(context);
                    } else {
                        // not login page, just navigate to home
                        deferred.resolve(context);
                    }
                } else {
                    deferred.resolve(context);
                }
                return deferred.promise;
            })
            .then(function(context) {
                $log.debug('init: go state, context ' + JSON.stringify(context));
                /**
                 * context sample
                 * {
  "isIOS": false,
  "isAndroid": false,
  "isWechat": false,
  "isMac": true,
  "isCordova": false,
  "lang": "dev",
  "token": "eyJ0eXAiOiJ",
  "has_network": 1,
  "state": "login"
}
                 */
                store.setInitContext(context);
                $state.go(context.state);
                if (context.isCordova) {
                    $timeout(function() {
                        navigator.splashscreen.hide();
                    }, 3000);
                }
            });
    });
})

.config(function($stateProvider, $urlRouterProvider) {

    // ROUTING with ui.router
    $urlRouterProvider.otherwise('/login');
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'main/templates/login/index.html',
            controller: 'LoginCtrl'
        })
        // this state is placed in the <ion-nav-view> in the index.html
        .state('main', {
            url: '/main',
            abstract: true,
            templateUrl: 'main/templates/tabs.html'
        })
        .state('main.home', {
            url: '/home',
            views: {
                'tab-home': {
                    templateUrl: 'main/templates/home/index.html',
                    // controller="SettingsController1 as settings"
                    // Using controller as makes it obvious which
                    // controller you are accessing in the template 
                    // when multiple controllers apply to an element.
                    // https://docs.angularjs.org/api/ng/directive/ngController
                    // controller: 'SomeCtrl as ctrl'
                    controller: 'HomeCtrl'
                }
            }
        })
        .state('main.product', {
            url: '/product',
            views: {
                'tab-product': {
                    templateUrl: 'main/templates/product/index.html',
                    controller: 'ProductCtrl as ctrl'
                }
            }
        })
        .state('main.customer', {
            url: '/customer?id',
            views: {
                'tab-customer': {
                    templateUrl: 'main/templates/customer/index.html',
                    controller: 'CustomerCtrl as ctrl'
                }
            }
        })
        .state('main.activity', {
            url: '/activity',
            views: {
                'tab-activity': {
                    templateUrl: 'main/templates/activity/index.html',
                    controller: 'ActivityCtrl as ctrl'
                }
            }
        })

    ;
});
