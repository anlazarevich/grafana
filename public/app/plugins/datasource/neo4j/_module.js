define([
  './datasource',
],
function (Neo4jDatasource) {
  'use strict';

  function metricsQueryEditor() {
    return {controller: 'Neo4jQueryCtrl', templateUrl: 'app/plugins/datasource/neo4j/partials/query.editor.html'};
  }

  function configView() {
    return {templateUrl: 'app/plugins/datasource/neo4j/partials/config.html'};
  }

  return {
    Datasource: Neo4jDatasource,
    configView: configView,
    metricsQueryEditor: metricsQueryEditor,
  };
});
