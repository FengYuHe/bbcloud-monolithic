var LOGIN_STATE_NAME = 'signIn';
var LOGOUT_STATE_NAME = 'signOut';

var LOGIN_REDIRECT_TO = '/dashboard';
var LOGOUT_REDIRECT_TO = '/sign-in';

var adminApp = angular.module('adminControlPanel', [
    'ng-admin',
    'satellizer',
    'ngFileUpload'
  ])
  .config(adminControlPanelConfig)
  .config(authConfig)
  .config(routeConfig)
  .run(revokedRedirect)
  .run(anonymousRedirect)
  .run(permissionDenyRedirect)
  .controller('SignInController', SignInController)
  // .controller('UploadController', UploadController)
  .controller('ChangeOwnPwdController', ChangeOwnPwdController)
  .controller('UserMenu', function($scope, $auth, $http) {
    $http.get("/api/auth/administrator-accounts/" + $auth.getPayload().sub).success(data => {
      this.name = data.name;
    }).catch(data => {
      if (data.status === 401) {
        $state.go(LOGIN_STATE_NAME);
      }
      this.name = "未知用户";
    });
  })
  .directive('generateCloudId', ['$http', function($http) {
    return {
      restrict: 'E',
      scope: {
        batch: '&'
      },
      template: '<a class="btn btn-default" ng-click="generateCloudId()">生成BBCloudId</a>',
      link: function(scope) {
        scope.generateCloudId = function() {
          $http.post('/api/auth/devices/generateBBCloudIds', {
            batchId: scope.batch().values.id
          }).success(function(data) {
            alert(data.msg)
          })
        };
      }
    };
  }])
  .directive('generateWechatId', ['$http', function($http) {
    return {
      restrict: 'E',
      scope: {
        batch: '&'
      },
      template: '<a ng-disabled="isDisabled" class="btn btn-default" ng-click="generateWechatIds()">生成Wechat device Ids</a>',
      link: function(scope) {
        scope.isDisabled = isDisabledCheckByState('wechat', scope.batch.state);
        scope.generateWechatIds = function() {
          if (scope.isDisabled) {
            return;
          }
          $http.post('/api/auth/devices/generateWechatDeviceIds', {
            batchId: scope.batch().values.id
          }).success(function(data) {
            alert(data.msg)
          })
        };
      }
    };
  }])
  .directive('uploadAliIds', ['$location', function($location) {
    return {
      restrict: 'E',
      scope: {
        batch: '&'
      },
      template: '<a class="btn btn-default" ng-click="toUploadPage()">上传阿里设备Ids</a>',
      link: function(scope) {
        scope.toUploadPage = function() {
          $location.path('/upload-aliIds/' + scope.batch().values.id);
        };
      }
    };
  }])
  .directive('uploadMacIds', ['$location', function($location) {
    return {
      restrict: 'E',
      scope: {
        batch: '&'
      },
      template: '<a class="btn btn-default" ng-click="toUploadPage()">上传设备MacIds</a>',
      link: function(scope) {
        scope.toUploadPage = function() {
          $location.path('/upload-macIds/' + scope.batch().values.id);
        };
      }
    }
  }])
  .directive('invalidateBatch', ['$location', function($location) {
    return {
      restrict: 'E',
      scope: {
        batch: '&'
      },
      template: '<a ng-disabled="isDisabled" class="btn btn-default" ng-click="toUploadPage()">删除该批次</a>',
      link: function(scope) {
        scope.isDisabled = isDisabledCheckByState('invalidate', scope.batch.state);
        scope.toUploadPage = function() {
          if (scope.isDisabled) {
            return;
          }
          $location.path('/delete-batch/' + scope.batch().values.id);
        };
      }
    };
  }]);

function isDisabledCheckByState(from, state) {
  var isDisabled = true;
  switch (from) {
    case 'ali':
      if (state == 0 || state == 2 || state == 3) {
        isDisabled = false;
      }
      break;
    case 'wechat':
      if (state == 2 || state == 3) {
        isDisabled = false;
      }
      break
    case 'mac':
      if (state == 3) {
        isDisabled = false;
      }
      break
    case 'invalidate':
      if (state == 0 || state == 2 || state == 3) {
        isDisabled = false;
      }
      break
    default:
      isDisabled = true;
  }
  return isDisabled;
}


function adminControlPanelConfig(NgAdminConfigurationProvider) {

  var nga = NgAdminConfigurationProvider;
  var admin = nga.application('BBCloud 后台管理').baseApiUrl('http://127.0.0.1:3000/api/auth/');

  admin.addEntity(nga.entity('administrator-accounts'));
  admin.addEntity(nga.entity('customer-accounts'));

  admin.addEntity(nga.entity('roles'));
  admin.addEntity(nga.entity('permissions'));

  admin.addEntity(nga.entity('manufacturers'));
  admin.addEntity(nga.entity('batches'));
  admin.addEntity(nga.entity('models'));

  administratorAccountConfig(nga, admin);
  customerAccountConfig(nga, admin);

  roleConfig(nga, admin);
  permissionConfig(nga, admin);

  manufacturerConfig(nga, admin);
  batchConfig(nga, admin);

  admin.menu(menuConfig(nga, admin));
  admin.header(headerConfig());
  admin.dashboard(nga.dashboard());

  nga.configure(admin);
}

function authConfig($authProvider) {
  $authProvider.tokenPrefix = 'administrator';
  $authProvider.baseUrl = '/api/administrator/';
}

function routeConfig($stateProvider) {
  var loginStateName = LOGIN_STATE_NAME;
  var logoutStateName = LOGOUT_STATE_NAME;
  var logoutRedirectTo = LOGOUT_REDIRECT_TO;

  $stateProvider.state("changePwd", {
    url: '/change-password',
    templateUrl: 'views/change-password.html'
  });

  $stateProvider.state('403', {
    parent: 'main',
    url: '/forbidden',
    templateUrl: 'views/403.html'
  });

  $stateProvider.state(loginStateName, {
    url: '/sign-in',
    templateUrl: 'views/sign-in.html',
    controller: 'SignInController',
    controllerAs: 'signInCtrl'
  });

  $stateProvider.state('uploadAliIds', {
    parent: 'main',
    url: '/upload-aliIds/:id',
    templateUrl: 'views/upload-aliIds.html',
    controller: function($scope, $stateParams, Upload, $timeout) {
      $scope.uploadAliIds = function(file) {
        file.upload = Upload.upload({
          url: '/api/auth/devices/uploadAliIds',
          data: {
            batchId: $stateParams.id,
            file: file
          },
        });

        file.upload.then(function(response) {
          $timeout(function() {
            file.result = response.data;
          });
        }, function(response) {
          if (response.status > 0)
            $scope.errorMsg = response.status + ': ' + response.data;
        }, function(evt) {
          // Math.min is to fix IE which reports 200% sometimes
          file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
      }
    }
  });
  $stateProvider.state('uploadMacIds', {
    parent: 'main',
    url: '/upload-macIds/:id',
    templateUrl: 'views/upload-macIds.html',
    controller: function($scope, $stateParams, Upload, $timeout) {
      $scope.uploadMacIds = function(file) {
        file.upload = Upload.upload({
          url: '/api/auth/devices/uploadMacIds',
          data: {
            batchId: $stateParams.id,
            file: file
          },
        });

        file.upload.then(function(response) {
          $timeout(function() {
            file.result = response.data;
          });
        }, function(response) {
          if (response.status > 0)
            $scope.errorMsg = response.status + ': ' + response.data;
        }, function(evt) {
          // Math.min is to fix IE which reports 200% sometimes
          file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
      }
    }
  });
  $stateProvider.state('invalidateBatch', {
    parent: 'main',
    url: '/delete-batch/:id',
    templateUrl: 'views/delete-batch.html',
    controller: function($scope, $stateParams, $http) {
      $scope.invalidateBatch = function() {
        $http.post('/api/auth/devices/invalidateBatch', {
          batchId: $stateParams.id,
          reason: $scope.reason
        }).success(function(data) {
          alert(data.msg)
        })
      }
    }
  });

  $stateProvider.state(logoutStateName, {
    url: '/sign-out',
    controller: function($auth, $location) {
      $auth.logout();
      $location.path(logoutRedirectTo);
    }
  });
}

function anonymousRedirect($rootScope, $state, $auth) {
  var signInStateName = LOGIN_STATE_NAME;
  var signOutStateName = LOGOUT_STATE_NAME;
  $rootScope.$on('$stateChangeStart', function(evt, toState) {
    if (!$auth.isAuthenticated()) {
      if (toState.name === signInStateName) return;
      if (toState.name === signOutStateName) return;
      console.log('not login, redirect to signin');
      $("#nprogress").hide();
      evt.preventDefault();
      return $state.go(signInStateName);
    }
  });
}

function permissionDenyRedirect(Restangular, $state) {
  Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    $state.reload();
    if (response.status === 403) {
      if ($state.current.name != "403") {
        $state.go('403');
        return false; // error handled
      }
    }
    return true; // error not handled
  });
}

function SignInController($auth, $location, notification) {
  var signInRedirectTo = LOGIN_REDIRECT_TO;
  this.signIn = function(credentials) {
    // $auth.setStorageType('sessionStorage');
    $auth.login(credentials)
      .then(function() {
        $location.path(signInRedirectTo);
      }).catch(function(data) {
        notification.log("Wrong Password.", {
          addnCls: 'humane-flatty-error'
        });
      });
  };
}

function revokedRedirect(Restangular, $state) {
  Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    $state.reload();
    if (response.status == 401) {
      if ($state.current.name != LOGIN_STATE_NAME) {
        $state.go(LOGIN_STATE_NAME);
        return false;
      }
    }
    return true;
  });
}


function ChangeOwnPwdController($scope, $http, notification, $auth, $location) {
  $scope.password = {
    oldPassword: "",
    newPassword: "",
    confirmPassport: ""
  };
  var signOutRedirectTo = LOGOUT_REDIRECT_TO;
  this.changepwd = function(pwd) {
    if (pwd.newPassword == "") {
      notification.log("Password can not be blank.", {
        addnCls: 'humane-flatty-error'
      });
    } else if (pwd.newPassword != pwd.confirmPassport) {
      notification.log("The pin code must be the same.", {
        addnCls: 'humane-flatty-error'
      });
    } else {
      $http.post("/api/auth/administrator-accounts/changeOwnPwd", {
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword
      }).success((reply) => {
        if (reply.code == 200) {
          notification.log("Password has been changed.", {
            addnCls: 'humane-flatty-success'
          });
          $auth.logout();
          $location.path(signOutRedirectTo);
        } else {
          notification.log("Change Password error.", {
            addnCls: 'humane-flatty-error'
          });
        }
      });
    }
  }
}

adminApp.directive('changePwd', function(Restangular, $state, notification, $http) {
  return {
    restrict: 'E',
    scope: true,
    link: function(scope, element, attrs) {
      scope.changePWD = () => {
        $(".modal", element).modal('show');
        scope.password = "";
        scope.confirm = "";
        scope.id = JSON.parse(attrs.administrator).id;
        console.log(attrs.administrator);
      }
      scope.changePWDBtn = function() {
        $(".modal", element).modal('hide');
        if (scope.password == scope.confirm) {
          $http.post("/api/auth/administrator-accounts/changePwd", {
            password: scope.password,
            id: scope.id
          }).success(function(data) {
            if (data.code == 200) {
              notification.log("Password Change Success.", {
                addnCls: 'humane-flatty-success'
              })
            } else {
              notification.log("Password Change Error.", {
                addnCls: 'humane-flatty-error'
              })
            }
          });
        } else {
          notification.log("Password Change Error.", {
            addnCls: 'humane-flatty-error'
          })
        }
      }
    },
    template: `<button class="btn btn-default btn-xs" ng-click="changePWD()"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>ChangePWD</button>
      <div class="modal fade">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title">
                Change Password
              </div>
            </div>
            <div class="modal-body">
              <form class="form">
                <div class="form-group">
                  <label class="">Password</label>
                  <input type="password" class="form-control" ng-model="password" placeholder="Password">
                </div>
                <div class="form-group">
                  <label>Confirm Password</label>
                  <input type="password" class="form-control" ng-model="confirm" placeholder="Confirm Password">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" ng-click="changePWDBtn()">Save changes</button>
            </div>
          </div>
        </div>
      </div>
    `
  }
});
