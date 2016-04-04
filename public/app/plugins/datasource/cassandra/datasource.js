define([],
function () {
  'use strict';

  function CassandraDatasource(instanceSettings, $q, backendSrv) {
    var baseUrl = '/api/v1/tig',
        isoFormat = "YYYY-MM-DD";
    this.name = instanceSettings.name;
    this.type = instanceSettings.type;
    this.url = instanceSettings.url + baseUrl;

    this._get = function(action, params) {
      return backendSrv.datasourceRequest({
        method: 'GET',
        url: this.url + action,
        params: params,
        withCredentials: true
      });
    };

    this.testDatasource = function() {
      return this._get('/catalog').then(function() {
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
      var target = options.targets[0];
      var params = self._createParams(options.range, target);
      return self._get('/data', params).then(function(response) {
        var result = response.data.data;
        var rs = transform(result, target);
        return {data: rs};
      });
    };

    function transform(result, target) {
      if(target.table === 'graph_stat') {
        return transform2Graph(result, target);
      } else {
        return trasform2Histogram(result);
      }
    }

    function transform2Graph(result, target) {
      var g = {
        nodes : [],
        edges : []
      },
      nodeSeq = 2, edgeSeq = 1, rootNodeId = '1';
      // add root node as qip
      g.nodes.push({
        id : rootNodeId,
        label : target.qip,
        x : Math.random(),
        y : Math.random(),
        size : 10,
        color : '#6E9ECE'
      });
      nodeSeq++;
      result.forEach(function(row) {
        var nodeId = nodeSeq.toString();
        nodeSeq++;
        g.nodes
            .push({
              id : nodeId,
              label : row.qname + '(' + row.count + ')',
              x : Math.random(),
              y : Math.random(),
              size : 10,
              color : '#FF0000'
            });
        g.edges.push({
          id : edgeSeq.toString(),
          source : rootNodeId, // root node has always id equal to 1
          target : nodeId,
          size : 10,
          color : '#ccc',
          type : 'curvedArrow',
          arrow : 'source',
          label : "This is the label"
        });
        edgeSeq++;
      });
      return g;
    }

    function trasform2Histogram(result) {
      var res = [], map = {};
      result.forEach(function(item) {
        var count = map[item.qip];
        if(!count) {
          map[item.qip] = item.count;
        } else {
          map[item.qip] += item.count;
        }
      });
      for(var qip in map) {
        res.push({qip: qip, count: map[qip]});
      }
      return res;
    }

    this._createParams = function(range, target) {
      var params = {'t0': range.from.format(isoFormat),
          't1': range.to.format(isoFormat)
      };
      params.table = target.table ? target.table : 'client_hist';
      if(target.table === 'graph_stat') {
        params.qip = target.qip;
      }
      return params;
    };

    this.metricFindQuery = function() {
      return $q.when([]);
    };

    this.annotationQuery = function() {
      return $q.when([]);
    };

  }

  return {
    CassandraDatasource: CassandraDatasource
  };
});