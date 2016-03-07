define([
  './datasource',
],
function (EarthquakeDatasource) {
  'use strict';

  function metricsQueryEditor() {
    return {controller: 'EarthquakeQueryCtrl', templateUrl: 'app/plugins/datasource/earthquake/partials/query.editor.html'};
  }

  function configView() {
    return {templateUrl: 'app/plugins/datasource/earthquake/partials/config.html'};
  }

  return {
    Datasource: EarthquakeDatasource,
    configView: configView,
    metricsQueryEditor: metricsQueryEditor,
  };
});
