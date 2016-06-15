define(['angular',
  'lodash',
  'app/core/config',
  'vendor/zero_clipboard'
],
function (angular, _, config, ZeroClipboard) {
  'use strict';

  ZeroClipboard.config({
    swfPath: config.appSubUrl + '/public/vendor/zero_clipboard.swf'
  });
  // bug fixing: Internet Explorer locks up using ZeroClipboard on a Bootstrap Modal
  // https://github.com/zeroclipboard/zeroclipboard/issues/159
  if (/MSIE|Trident/.test(window.navigator.userAgent)) {
    (function($) {
      var zcClass = '.' + ZeroClipboard.config('containerClass');
      var proto = $.fn.modal.Constructor.prototype;
      proto.enforceFocus = function() {
        $(document)
          .off('focusin.bs.modal')  /* Guard against infinite focus loop */
          .on('focusin.bs.modal', $.proxy(function(e) {
            if (this.$element[0] !== e.target &&
               !this.$element.has(e.target).length &&
               /* Adding this final condition check is the only real change */
               !$(e.target).closest(zcClass).length
            ) {
              this.$element.focus();
            }
          }, this));
      };
    })(window.jQuery);
  }

  var module = angular.module('grafana.controllers');

  module.controller('ShareModalCtrl', function($scope, $rootScope, $location, $timeout, timeSrv, $element, templateSrv, linkSrv) {

    $scope.options = { forCurrent: true, includeTemplateVars: true, theme: 'current' };
    $scope.editor = { index: $scope.tabIndex || 0};

    $scope.init = function() {
      $scope.modeSharePanel = $scope.panel ? true : false;

      $scope.tabs = [{title: 'Link', src: 'shareLink.html'}];

      if ($scope.modeSharePanel) {
        $scope.modalTitle = 'Share Panel';
        $scope.tabs.push({title: 'Embed', src: 'shareEmbed.html'});
      } else {
        $scope.modalTitle = 'Share Dashboard';
      }

      if (!$scope.dashboard.meta.isSnapshot) {
        $scope.tabs.push({title: 'Snapshot sharing', src: 'shareSnapshot.html'});
      }

      $scope.buildUrl();
    };

    $scope.buildUrl = function() {
      var baseUrl = $location.absUrl();
      var queryStart = baseUrl.indexOf('?');

      if (queryStart !== -1) {
        baseUrl = baseUrl.substring(0, queryStart);
      }

      var params = angular.copy($location.search());

      var range = timeSrv.timeRange();
      params.from = range.from.valueOf();
      params.to = range.to.valueOf();

      if ($scope.options.includeTemplateVars) {
        templateSrv.fillVariableValuesForUrl(params);
      }

      if (!$scope.options.forCurrent) {
        delete params.from;
        delete params.to;
      }

      if ($scope.options.theme !== 'current') {
        params.theme = $scope.options.theme;
      }

      if ($scope.modeSharePanel) {
        params.panelId = $scope.panel.id;
        params.fullscreen = true;
      } else {
        delete params.panelId;
        delete params.fullscreen;
      }

      $scope.shareUrl = linkSrv.addParamsToUrl(baseUrl, params);

      var soloUrl = $scope.shareUrl;
      soloUrl = soloUrl.replace(config.appSubUrl + '/dashboard/', config.appSubUrl + '/dashboard-solo/');
      soloUrl = soloUrl.replace("&fullscreen", "");

      $scope.iframeHtml = '<iframe src="' + soloUrl + '" width="450" height="200" frameborder="0"></iframe>';

      $scope.imageUrl = soloUrl.replace('/dashboard-solo/', '/render/dashboard-solo/');
      $scope.imageUrl += '&width=1000';
      $scope.imageUrl += '&height=500';
    };

  });

  module.directive('clipboardButton',function() {
    return function(scope, elem) {
      new ZeroClipboard(elem[0]);
    };
  });

});
