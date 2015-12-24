angular.module('main')


/** 
 * Persistence Object Manager
 * depends on lodash
 */
.service('store', function($log, $localStorage, $sessionStorage, Config) {

    $localStorage.env = Config.ENV;
    $localStorage.build = Config.BUILD;

    function _log(s) {
        $log.log('[store] ' + s);
    }

    this.env = $localStorage.env;
    this.build = $localStorage.build;

    this.setToken = function(token) {
        $localStorage.token = token;
    }

    this.getToken = function() {
        return $localStorage.token;
    }

    this.delToken = function() {
        delete $localStorage.token;
    }

    this.setUserId = function(userId) {
        $localStorage.userId = userId;
    }

    this.getUserId = function() {
        return $localStorage.userId;
    }

    /**
     * [setUserProfile description]
     * @param {[type]} data [description]
     */
    this.setUserProfile = function(data) {
        _log('setUserProfile ' + JSON.stringify(data));
        $localStorage.userProfile = data;
    }

    /**
     * [getUserProfile description]
     * @return {[type]} [description]
     * {
  "name": "David Zhang",
  "sex": "M",
  "phone_num": 13502876545,
  "account": "david",
  "password": "123456",
  "_id": "5668ed9013f772d8d2f660bd",
  "__v": 0,
  "tags": []
}
     */
    this.getUserProfile = function() {
        return $localStorage.userProfile;
    }


    this.setInitContext = function(data) {
        $localStorage.initContext = data;
    }

    this.getInitContext = function() {
        return $localStorage.initContext;
    }


})

.service('webq', function($http, $log, $timeout, $q, store, Config) {

    this.login = function(username, password) {
        var deferred = new $q.defer();

        $http.post('http://{0}/mdt/v1/token/apply'.f(store.env.host), {
            username: username,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            responseType: 'json'
        }).
        success(function(data, status, headers) {
            $log.debug('login api response: ' + JSON.stringify(data));
            // checkout token/apply response data in 
            // https://gitlabhost.rtp.raleigh.ibm.com/mobilecommerce/mdt/issues/56
            if (data && data.rc && data.rc === 2) {
                deferred.resolve(data.data);
            } else {
                deferred.reject(data);
            }
        }).
        error(function(data, status, headers) {
            $log.debug('error ' + status);
            $log.debug(data);
            deferred.reject(data);
        });

        return deferred.promise;
    }

    this.getUserProfile = function() {
        var deferred = $q.defer();
        $http.get('http://{0}/mdt/v1/sales/getinfobyid/{1}'.f(store.env.host, store.getUserId()), {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer {0}'.f(store.getToken())
            },
            responseType: 'json'
        }).
        success(function(data, status, headers) {
            $log.debug('login api response: ' + JSON.stringify(data));
            if (data) {
                deferred.resolve(data);
            } else {
                deferred.reject(data);
            }
        }).
        error(function(data, status, headers) {
            $log.error('error ' + status);
            $log.debug(data);
            deferred.reject(data);
        });

        return deferred.promise;
    }

    this.getMemberInfoById = function(id) {
        var deferred = $q.defer();
        $http.get('http://{0}/mdt/v1/Member/getinfobyid/{1}'.f(store.env.host, id), {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer {0}'.f(store.getToken())
                },
                responseType: 'json'
            })
            .success(function(data) {
                $log.debug('webq getMemberInfoById', data);
                deferred.resolve(data);
            })
            .error(function(err) {
                $log.error(err);
                deferred.reject(err);
            });

        return deferred.promise;
    }

})

.service('HeaderBarMgr', function($ionicPopup, $rootScope, $state, $http, $log, $ionicPopup, store, webq, Config) {

    var self = this;
    this.isMounted = false;


    this.mount = function() {

        if (self.isMounted)
            return;

        self.isMounted = true;

        $rootScope.HeaderBarMgrFn = {
            // retrieve profile
            profile: (function() {
                return store.getUserProfile();
            })(),
            // show the qr code
            qrcode: function() {
                // display QR Code
                var popup = $ionicPopup.alert({
                    title: '马上扫描二维码注册会员',
                    template: '<div class="item item-image"> <img src="main/assets/images/qrcode-123456.png"> </div>', // String (optional). The URL of an html template to place in the popup   body.
                    okText: '关闭', // String (default: 'OK'). The text of the OK button.
                    okType: 'button-stable', // String (default: 'button-positive'). The type of the OK button.
                });
                popup.then(function(res) {
                    $log.log('qrcode popup closed.');
                    popup = null;
                });

                $rootScope.$on('socketio', function(event, data) {
                    $log.log('get socketio data:' + JSON.stringify(data));
                    if (popup != null) {
                        popup.close();
                        $state.go('main.customer', {
                            id: data.mdt_memberid
                        });
                    }
                });

            },
            // logout system
            logout: function() {
                var confirmPopup = $ionicPopup.confirm({
                    title: '导购助手',
                    template: '您确定要登出?',
                    okText: '是',
                    cancelText: '否'
                });
                confirmPopup.then(function(res) {
                    if (res) {
                        store.delToken();
                        $state.go('login')
                    } else {
                        console.log('You are not sure');
                    }
                });
            },
            // handle cart clicking event
            cart: function() {

            },
            // handle message clicking event
            messages: function() {

            },
            // handle support clicking event
            support: function() {

            },
            // handle settings clicking event
            settings: function() {

            }
        }
    }

    this.unmount = function() {
        if (!self.isMounted)
            return;
        delete $rootScope.HeaderBarMgrFn;
        self.isMounted = false;
    }

})

.service('Socketio', function($rootScope, $log, $timeout, Config) {
    // print server URL
    var self = this;
    var socket = null;
    var isRunning = false;

    this.start = function() {
        if (isRunning) return;
        $log.log('Socketio: connect to ' + Config.ENV.host);

        // 'http://localhost:3010'
        socket = io('http://' + Config.ENV.host);
        socket.on('connect',
            function(data) {
                $log.debug('Socketio connected.')
                isRunning = true;
            });

        socket.on('notification', function(data) {
            $log.debug('Socketio notification <<');
            $log.debug("data type:" + typeof data);
            $log.debug(data);
            $log.debug('Socketio notification END.')
            $rootScope.$broadcast('socketio', data);
        });

        socket.on('disconnect', function() {
            $log.debug('Socketio disconnect.')
            isRunning = false;
        });
    }
})

/*
 * network manager is only available after cordova plugins are loaded.
 * if not, will get an error that says 'TypeError: undefined is not an object'
 * https://github.com/apache/cordova-plugin-network-information/blob/master/doc/index.md
 * iOS Quirks to support iPhone 5S,
 * iOS does not have specific info like WIFI, 3G ... just cellular or not
 * Network Status Array
 *   states[Connection.UNKNOWN] = 'Unknown connection';
 *   states[Connection.ETHERNET] = 'Ethernet connection';
 *   states[Connection.WIFI] = 'WiFi connection';
 *   states[Connection.CELL_2G] = 'Cell 2G connection';
 *   states[Connection.CELL_3G] = 'Cell 3G connection';
 *   states[Connection.CELL_4G] = 'Cell 4G connection';
 *   states[Connection.CELL] = 'Cell generic connection';
 *   states[Connection.NONE] = 'No network connection';
 */
.service('ntm', function($rootScope, $log) {

    var self = this;
    // start a agent process to run intervally
    // monitor the network switch event, make sure to call this interface
    // after cordova device ready event is fired.
    this.start = function() {
        var hasNetwork;
        setInterval(function() {
            try {
                // $rootScope.$broadcast('ntm:', JSON.parse(e.data));
                switch (self.getNetwork()) {
                    case -1:
                        $log.debug('network manager is only available after cordova plugins are loaded.');
                        break;
                    case 0:
                        if (typeof hasNetwork === 'undefined') {
                            hasNetwork = false;
                        } else if (hasNetwork) {
                            hasNetwork = false;
                            $rootScope.$broadcast('ntm', 'online2offline');
                        }
                        break;
                    case 1:
                        if (typeof hasNetwork === 'undefined') {
                            hasNetwork = true;
                        } else if (!hasNetwork) {
                            hasNetwork = true;
                            $rootScope.$broadcast('ntm', 'offline2online');
                        }
                        break;
                    default:
                        $log.error('UNKNOWN Network Status Type.');
                        break;
                }
            } catch (e) {
                $log.error(e);
            }
        }, 5000);
    };

    // current this method only supports iOS
    // 1 - online
    // 0 - offline
    // -1 - plugin is not loaded
    this.getNetwork = function() {
        if (navigator.connection && navigator.connection.type) {
            if (_.indexOf([Connection.WIFI, Connection.CELL], navigator.connection.type) != -1) {
                // network is available
                return 1;
            } else {
                // device is offline
                return 0;
            }
        } else {
            return -1;
        }
    };
})



;
