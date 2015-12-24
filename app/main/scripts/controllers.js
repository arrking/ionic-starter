'use strict';
angular.module('main')

.controller('LoginCtrl', function($rootScope, $state, $scope, $stateParams, $ionicLoading, $log, webq, Config, store) {
    $log.log('LoginCtrl in');
    // $scope.errMessage = "fpp"

    $scope.loginData = {
        username: $stateParams.username || '',
        password: null
    };
    $scope.enableLoginBtn = false;
    var usernameRegex = /^\w+([-+.]\w+)*$/,
        passwordRegex = /\S{6,20}/;


    $scope.validateLoginData = function() {
        var username = $scope.loginData.username || '',
            password = $scope.loginData.password || '';

        if (!usernameRegex.test(username)) {
            $scope.enableLoginBtn = false;
            return false;
        }

        if (!passwordRegex.test(password)) {
            $scope.enableLoginBtn = false;
            return false;
        }

        $scope.enableLoginBtn = true;
    };

    $scope.doLogin = function() {
        // empty te errMessage
        $scope.errMessage = '';
        if ($scope.loginData.username &&
            $scope.loginData.password) {
            $ionicLoading.show({
                template: '登录中 ...'
            });
            webq.login($scope.loginData.username,
                    $scope.loginData.password)
                .then(function(data) {
                    store.setToken(data.token);
                    store.setUserId(data._id);
                    webq.getUserProfile().then(function(prof) {
                        $scope.loginData.username = '';
                        $scope.loginData.password = '';
                        store.setUserProfile(prof);
                        $state.go('main.home');
                    });
                }, function(err) {
                    // TODO show an error message
                    if (err.rc) {
                        switch (err.rc) {
                            case 1:
                                $scope.errMessage = '密码错误';
                                break;
                            case 3:
                                $scope.errMessage = '系统错误，稍后再试';
                                break;
                            case 4:
                                $scope.errMessage = '系统异常，稍后再试';
                                break;
                            case 5:
                                $scope.errMessage = '不存在该用户';
                                break;
                            default:
                                $log.error(err);
                        }
                    } else {
                        $log.error('>> can not understand :');
                        $log.error(err);
                        $scope.loginData = {};
                    }
                }).finally(function() {
                    $ionicLoading.hide();
                });
        } else {
            $scope.errMessage = '用户名或密码不能为空';
        }
    }

})

.controller('ProductCtrl', function($log, webq, Config) {

    $log.log('Hello from your Controller: ProductCtrl in module main:. This is your controller:', this);

})

.controller('HomeCtrl', function($rootScope, $state, $ionicPopup, $log, $scope, store, webq, Config, HeaderBarMgr) {
    $scope.profile = store.getUserProfile();
    $log.log('Profile ' + JSON.stringify($scope.profile));

    HeaderBarMgr.mount();
})

.controller('CustomerCtrl', function($scope, $stateParams, $log, webq, Config) {
    $log.log('CustomerCtrl $stateParams: ', $stateParams);
    $scope.searchtext = '';
    $scope.current_cutomer = {
        name: '', // nick name
        id: '', // member id
        openId: '', // openId from wechat
        telephone: '', // phone number
        headimgurl: '', // avatar URL
        address: '', // home, company address
        size: { // 身长 M, S, L, XL, XXL
            pants: '',
            jacket: ''
        }
    };
    var customers = [{
        name: '张三',
        headimgurl: 'main/assets/images/leifeng.jpg',
        telephone: '',
        size: {
            pants: 'M',
            jacket: 'M'
        },
        address: '海淀',
        id: "dummy1"
    }, {
        name: '李四',
        headimgurl: 'main/assets/images/leifeng2.jpg',
        telephone: '',
        size: {
            pants: 'M',
            jacket: 'M'
        },
        address: '海淀',
        id: "dummy2"
    }];

    $scope.customers = customers;

    if ($stateParams.id) {
        webq.getMemberInfoById($stateParams.id)
            .then(function(data) {
                $log.log('get customer data', data);
                $scope.current_cutomer.name = data.nick_name;
                $scope.current_cutomer.headimgurl = data.advance_profile.headimgurl;
                $scope.current_cutomer.address = data.basic_profile.address.city;
                $scope.current_cutomer.id = data._id;
                $scope.current_cutomer.openId = data.wechat_openid
            }, function(err) {
                $log.error(err);
            })
    }

    $scope.filter_customers = function(new_search_text) {
        $scope.customers = _.filter(customers, function(val, index) {
            return (val.name.toLowerCase().indexOf(new_search_text) >= 0);
        });
    }

    $scope.link = function(id) {
        $scope.current_cutomer = _.filter($scope.customers, {
            id: id
        })[0];
    }

})

.controller('ActivityCtrl', function($log, webq, Config) {

    $log.log('Hello from your CustomerCtrl: HomeCtrl in module main:. This is your controller:', this);

})

;
