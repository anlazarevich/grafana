define([
  'angular',
  './queryCtrl'
],
function () {
  'use strict';

  function Neo4jDatasource(instanceSettings, $q, backendSrv) {
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;

    this.testDatasource = function() {
        var options = {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            url: this.url + '/db/data'
        };
        return backendSrv.datasourceRequest(options).then(function() {
          return { status: "success", message: "Data source is working", title: "Success" };
        }, function(err) {
          if (err.data && err.data.error) {
            return { status: "error", message: err.data.error, title: "Error" };
          } else {
            return { status: "error", message: err.status, title: "Error" };
          }
        });
      };

    this.query = function(options) {
        var self = this;
        var promises = options.targets.map(function() {
          return backendSrv.datasourceRequest(self._createQuery()).then(function(result) {
            return convert(result);
          });
        });
        return $q.all(promises).then(function(res) {
          return {data: res[0]};
        });
      };

    function convert(res) {
        var g = {
            nodes: [],
            edges: []
          }, nodeIds = {}, edgeIds = {},
          colors={'Client': '#6E9ECE', 'Virus': '#FF0000', 'Host': '#6DCE9E'};
        res.data.results[0].data.forEach(function(row) {
          var graph = row.graph;
          graph.nodes.forEach(function(node) {
            if(!nodeIds[node.id]) {
              nodeIds[node.id] = true;
              var label = node.labels[0];
              g.nodes.push({
                id: node.id,
                label: label === 'Virus' ? node.properties.name: node.properties.ip,
                x: Math.random(),
                y: Math.random(),
                size: 10,
                color: colors[label]
              });
            }
          });
          graph.relationships.forEach(function(edge) {
            if(!edgeIds[edge.id]) {
              edgeIds[edge.id] = true;
              g.edges.push({
                id: edge.id,
                source: edge.startNode,
                target: edge.endNode,
                size: 10,
                color: '#ccc',
                type: 'curvedArrow',
                arrow: 'source',
                label: "This is the label"
              });
            }
          });
        });
        return g;
      }

    this._createQuery = function() {
        return {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            url: this.url + '/db/data/transaction/commit',
            data: {
              "statements": [
                             {
                                "statement": "match (client:Client)-[q:Query]->(host:Host)<-[r]-(virus:Virus) "
                                + "return distinct client, host, q, r, virus",
                                "resultDataContents": [
                                 "row",
                                 "graph"
                               ],
                               "includeStats": false
                             }
                           ]
                         }
        };
      };

    this.metricFindQuery = function() {
        return $q.when([]);
      };

    this.annotationQuery = function() {
        return $q.when([]);
      };
  }

  return {Neo4jDatasource: Neo4jDatasource};

});
