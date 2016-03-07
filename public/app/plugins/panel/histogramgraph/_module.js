define([
  'angular',
  'app/app',
  'lodash',
  'app/core/utils/kbn',
  'app/core/time_series',
  'app/features/panel/panel_meta',
  './panel',
],
function (angular, app, _, kbn, TimeSeries, PanelMeta) {
  'use strict';

  function panelDirective() {
    return {
      controller: PanelCtrl,
      templateUrl: 'app/plugins/panel/histogramgraph/module.html'
      };
  }

  function PanelCtrl($scope, $rootScope, panelSrv, panelHelper, annotationsSrv) {

    $scope.panelMeta = new PanelMeta({
      panelName: 'Graph',
      editIcon:  "fa fa-dashboard",
      fullscreen: true,
      metricsEditor: true
    });

    // Set and populate defaults
    var _d = {
      links: [],
      datasource: null,
      maxDataPoints: 3,
      interval: null,
      targets: [{}],
      cacheTimeout: null,
      nullText: null,
      nullPointMode: 'connected'
    };

    _.defaults($scope.panel, _d);

    $scope.unitFormats = kbn.getUnitFormats();

    $scope.setUnitFormat = function(subItem) {
      $scope.panel.format = subItem.value;
      $scope.render();
    };

    $scope.init = function() {
      panelSrv.init($scope);
    };

    $scope.refreshData = function(datasource) {
      panelHelper.updateTimeRange($scope);

      $scope.annotationsPromise = annotationsSrv.getAnnotations($scope.dashboard);

      return panelHelper.issueMetricQuery($scope, datasource)
        .then($scope.dataHandler, function(err) {
          $scope.series = [];
          $scope.render();
          throw err;
        });
    };

    $scope.dataHandler = function(results) {
      $scope.annotationsPromise
      .then(function(annotations) {
        $scope.panelMeta.loading = false;
        results.annotations = annotations;
        $scope.render(results);
      }, function() {
        $scope.panelMeta.loading = false;
        $scope.render(results);
      });
    };

    $scope.render = function(data) {
      panelHelper.broadcastRender($scope, data);
    };

    $scope.init();
  }

  return {
    panel: panelDirective
  };
});
