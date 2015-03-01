'use strict';
var App;

App = angular.module('app', ['ngCookies', 'ngResource', 'app.controllers', 'app.directives', 'app.filters', 'app.services', 'partials']);

App.config([
  '$routeProvider', '$locationProvider', function($routeProvider, $locationProvider, config) {
    $routeProvider.when('/', {
      templateUrl: '/partials/katalog.html'
    }).otherwise({
      redirectTo: '/'
    });
    return $locationProvider.html5Mode(false);
  }
]);
;'use strict';
/* Controllers*/

angular.module('app.controllers', ['ui.sortable']).controller('AppCtrl', [
  '$scope', '$location', '$resource', '$rootScope', function($scope, $location, $resource, $rootScope) {
    $scope.$location = $location;
    $scope.$watch('$location.path()', function(path) {
      return $scope.activeNavId = path || '/';
    });
    return $scope.getClass = function(id) {
      if ($scope.activeNavId.substring(0, id.length) === id) {
        return 'active';
      } else {
        return '';
      }
    };
  }
]).controller('PagesCtrl', function($scope, $q, pagesSrv, $filter) {
  var loadpages;
  $scope.pages = [];
  $scope.tileSize = 'm-smallTiles';
  $scope.cutting = false;
  $scope.cutPageIndex = null;
  $scope.isPreview = false;
  $scope.isLoading = false;
  $scope.cutPage = function(index) {
    $scope.cutting = true;
    return $scope.cutPageIndex = index;
  };
  $scope.pastePage = function(index) {
    var cutPage;
    cutPage = $scope.pages[$scope.cutPageIndex];
    $scope.pages.splice(index, 0, cutPage);
    if (index <= $scope.cutPageIndex) {
      $scope.cutPageIndex++;
    }
    $scope.pages.splice($scope.cutPageIndex, 1);
    $scope.cutting = false;
    return $scope.save();
  };
  $scope.sortPages = {
    stop: function(e, ui) {
      return $scope.save();
    }
  };
  $scope.changeTileSize = function(size) {
    $scope.tileSize = size;
    return false;
  };
  loadpages = function() {
    return pagesSrv.load().success(function(response) {
      return $scope.pages = response;
    }).error(function(status, error) {
      return console.log('not loaded', status, error);
    });
  };
  $scope.save = function() {
    return pagesSrv.save($scope.pages).success(function(response) {
      return console.log('save success: ', response);
    }).error(function(status, error) {
      return console.log('save error: ', status, error);
    });
  };
  $scope["delete"] = function(index) {
    return pagesSrv["delete"](index).success(function(response) {
      $scope.pages.splice(index, 1);
      $scope.save();
      return console.log('delete success: ', response);
    }).error(function(status, error) {
      return console.log('delete error: ', response, error);
    });
  };
  $scope.deletePageFiles = function(index) {
    return pagesSrv["delete"](index).error(function(status, error) {
      return console.log('delete error: ', response, error);
    });
  };
  $scope.upload = function(form) {
    return pagesSrv.upload(form).always(function() {
      return $scope.hideLoader();
    });
  };
  $scope.edit = function(index) {
    $scope.pages[index].needsRefresh = true;
    $scope.save();
    return pagesSrv.edit(index);
  };
  $scope.refresh = function(index) {
    $scope.pages[index].refreshing = true;
    return pagesSrv.refresh(index).then(function() {
      delete $scope.pages[index].needsRefresh;
      delete $scope.pages[index].refreshing;
      $scope.pages[index].nocache = '?' + new Date().getTime();
      return $scope.save();
    });
  };
  $scope.pdf = function(pages) {
    return pagesSrv.pdf(pages).success(function(response) {
      return console.log('PDF generated! ', response);
    }).error(function(status, error) {
      return console.log('Error occured while generating PDF: ', status, error);
    });
  };
  $scope.print = function(page) {
    return pagesSrv.pdf(page);
  };
  $scope.preview = function(page) {
    var previewPage;
    previewPage = $scope.pages[page].svg.file;
    $scope.previewImgURL = "jpg/w800/" + $filter('encodeFilename')(previewPage) + ".jpg";
    return $scope.isPreview = true;
  };
  $scope.hidePreview = function() {
    return $scope.isPreview = false;
  };
  $scope.showLoader = function() {
    return $scope.$apply(function() {
      return $scope.isLoading = true;
    });
  };
  $scope.hideLoader = function() {
    return $scope.isLoading = false;
  };
  return loadpages();
});
;'use strict';
/* Directives*/

angular.module('app.directives', ['app.services']).directive('tooltip', function() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      return $(element).tooltip();
    }
  };
}).directive('loadpages', function() {
  return {
    restrict: 'A',
    template: 'Load pages',
    link: function(scope, element) {
      return $(element).bind('click', function(e) {
        e.preventDefault();
        scope.loadpages();
        return false;
      });
    }
  };
}).directive('save', function() {
  return {
    restrict: 'A',
    template: 'Save',
    link: function(scope, element) {
      return $(element).bind('click', function(e) {
        e.preventDefault();
        scope.save();
        return false;
      });
    }
  };
}).directive('pdf', function() {
  return {
    restrict: 'A',
    template: 'Zbuduj katalog',
    link: function(scope, element) {
      return $(element).bind('click', function(e) {
        e.preventDefault();
        element.text('Robi się');
        scope.pdf(scope.pages).success(function(response) {
          return element.text('Zbuduj katalog');
        });
        return false;
      });
    }
  };
}).directive('addpage', function() {
  return {
    restrict: 'E',
    template: '<form enctype="multipart/form-data"><input name="page" type="file" class="addpage"></form>',
    link: function(scope, element, attrs) {
      var form, input, onUploadPageFail, replace, upload;
      form = element.find('form');
      input = form.find('input[type="file"]');
      input.bind('change', function() {
        scope.showLoader();
        return form.submit();
      });
      form.bind('submit', function(e) {
        e.preventDefault();
        if (attrs.index != null) {
          return upload(this).done(function(res) {
            var page;
            page = res.data;
            return replace(attrs.index, page);
          });
        } else {
          return upload(this).done(function(res) {
            scope.pages.push(res.data);
            return scope.save();
          });
        }
      });
      replace = function(index, page) {
        return scope.deletePageFiles(index).success(function(res) {
          scope.pages[index] = page;
          return scope.save();
        });
      };
      upload = function(form) {
        var def;
        def = new $.Deferred();
        scope.upload(form).done(function(res) {
          res = JSON.parse(res);
          if (res.status === 'ok') {
            return def.resolve(res);
          } else {
            onUploadPageFail(res);
            return def.reject(res);
          }
        }).fail(function(failResp) {
          console.log('directive upload fail');
          onUploadPageFail(failResp);
          return def.reject(failResp);
        });
        return def.promise();
      };
      return onUploadPageFail = function(res) {
        return console.log('submit error', res);
      };
    }
  };
}).directive('delete', function() {
  return function(scope, element, attrs) {
    return $(element).click(function(e) {
      var index;
      e.preventDefault();
      index = parseInt(attrs.index, 10);
      if (confirm('Czy na pewno chcesz usunąć stronę? ' + '[' + (index + 1) + ']')) {
        scope["delete"](index);
      }
      return false;
    });
  };
}).directive('paste', function() {
  return function(scope, element, attrs) {
    return $(element).click(function(e) {
      e.preventDefault();
      scope.$apply(attrs.paste);
      return false;
    });
  };
}).directive('print', function() {
  return function(scope, element) {
    return $(element).click(function(e) {
      var printframe;
      e.preventDefault();
      printframe = $('#printFrame');
      printframe.load(function() {
        return printframe[0].contentWindow.print();
      });
      printframe[0].src = 'svg/' + scope.page.svg.file;
      console.log(scope.page);
      return false;
    });
  };
}).directive('disablepage', function() {
  return function(scope, element) {
    return $(element).click(function(e) {
      e.preventDefault();
      if (scope.page.status === 'disable') {
        scope.page.status = 'enable';
      } else {
        scope.page.status = 'disable';
      }
      scope.save();
      return false;
    });
  };
}).directive('lazySrc', function($window, $document) {
  var lazyImage, lazyLoader;
  lazyLoader = (function() {
    function lazyLoader() {}

    lazyLoader.test = 'test1';

    return lazyLoader;

  })();
  lazyImage = (function() {
    function lazyImage() {
      console.log('lazy image created');
    }

    return lazyImage;

  })();
  return {
    restrict: 'A',
    link: function($scope, $element) {
      return console.log(lazyLoader.test);
    }
  };
});
;'use strict';
/* Filters*/

angular.module('app.filters', []).filter('interpolate', [
  'version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }
]).filter('encodeFilename', function() {
  return function(filename) {
    return filename.split(' ').join('_');
  };
});
;'use strict';
/* Sevices*/

angular.module('app.services', []).factory('version', function() {
  return "0.2";
}).service('pagesSrv', function($rootScope, $http, $q) {
  this.save = function(json) {
    return $http.post('http://localhost:3000/api/save', {
      jsondata: JSON.stringify(json)
    });
  };
  this.load = function() {
    return $http.get('http://localhost:3000/api/pages');
  };
  this.pdf = function(json) {
    console.log('generationg PDF');
    return $http.post('http://localhost:3000/api/pdf', {
      jsondata: JSON.stringify(json)
    });
  };
  this["delete"] = function(index) {
    console.log('deleting page number ' + (parseInt(index, 10) + 1));
    return $http.get('http://localhost:3000/api/delete/' + index);
  };
  this.edit = function(index) {
    console.log('edit page number ' + (index + 1));
    return $http.get('http://localhost:3000/api/edit/' + index);
  };
  this.refresh = function(index) {
    console.log('refreshing page number ' + (index + 1));
    return $http.get('http://localhost:3000/api/refresh/' + index);
  };
  return this.upload = function(form) {
    var def;
    def = new $.Deferred();
    $(form).ajaxSubmit({
      url: 'http://localhost:3000/api/add',
      type: 'POST',
      timeout: 600000,
      success: function(response) {
        return def.resolve(response);
      },
      error: function(response) {
        console.log('srv upload error');
        return def.reject(response);
      }
    });
    return def.promise();
  };
});
;
//# sourceMappingURL=app.js.map